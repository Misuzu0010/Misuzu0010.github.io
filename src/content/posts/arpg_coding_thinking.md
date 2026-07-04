---
title: "一些可复用的设计模式（1）"
description: "做Demo时用到的设计思路"
pubDate: 2026-06-23
published: 2026-06-23
updated: 2026-07-03
category: "技术笔记"
tags: ["UE5","C++","ARPG"]
---

# 对话与任务系统

## 1 设计思路

在设计这个系统的时候，我一开始想到的闭环其实非常直觉：

**接近 NPC -> E 键交互 -> 触发扫描 -> 检测到可对话人物 -> 进入对话 -> 选择选项 -> 接取任务 -> 收集道具 -> 提交道具 -> 判断是否满足条件 -> 给出完成当前任务的反馈**

这个闭环看起来挺顺的，甚至一眼看过去会觉得“那不就是按顺序写函数吗”。但是稍微拆一下就会发现，这里面其实混了好几层东西：

- 玩家怎么检测到 NPC，这是交互系统的问题；
- NPC 怎么知道自己能不能说话，这是 NPC / DialogueParticipant 的问题；
- 对话内容从哪里来，这是 DialogueDefinition 的问题；
- 点选项之后要发生什么，这是 Effect 的问题；
- 任务状态怎么保存，这是 QuestRuntimeState / SaveGame 的问题；
- UI 怎么刷新，这是 Widget 的问题。

所以如果一上来就想把整条链路全部写完，很容易变成一个巨大的、什么都管的类。

后面我又想了一下，最前面的这一段：

**接近 NPC -> E 键交互 -> 触发扫描 -> 检测到可对话人物 -> 进入对话**

其实也不一定应该一直这么做。更理想的交互应该是：玩家进入某个范围之后，系统先知道“附近有可交互对象”，然后显示一个交互提示，玩家按 E 再真正开始对话。

不过这部分属于交互体验的优化，不应该卡住对话系统本身。所以当前阶段我还是先跑通最小闭环：

**开始对话 -> 显示节点 -> 显示选项 -> 点击选项 -> 执行效果 -> 跳转或关闭**

基于这个目标，我暂时把系统拆成了下面几层。

- `DialogueDefinition`

  一段对话的静态资产。里面保存对话 ID、起始节点、所有节点。

- `QuestDefinition`

  一个任务的静态资产。里面保存任务 ID、任务标题、任务目标、任务奖励和前置条件。

- `DialogueNPC`

  NPC 的 Actor 层。现在主要用来承载碰撞体、模型和对话组件。

- `DialogueParticipantComponent`

  对话参与者组件。挂到某个 Actor 上之后，这个 Actor 就可以作为对话对象。

- `DialogueQuestSubsystem`

  对话和任务的运行时管理器。这个名字听起来很大，但当前最重要的职责其实就是：保存当前对话会话、对话进度、任务进度、全局旗标。

- `EscapeDialogueTypes`

  各种枚举和结构体定义。比如对话节点、对话选项、条件、效果、任务状态、奖励结构、存档结构等。

这里有个地方我一开始也容易想偏：`DialogueQuestSubsystem` 不是每次对话创建出来的东西，也不是每个任务一个管理器。它是挂在 `GameInstance` 上的全局运行时管理器。也就是说，它更像当前存档里的“对话/任务状态中心”。

## 2 DialogueType ENUM 部分

我先把对话里可能出现的概念枚举出来。

```cpp
UENUM(BlueprintType)
enum class EDialogueNodeType : uint8
{
	Line UMETA(DisplayName="普通对白节点"),
	Choice UMETA(DisplayName="玩家选项节点"),
	Reward UMETA(DisplayName="奖励发放节点"),
	Exit UMETA(DisplayName="结束对话节点"),
	Branch UMETA(DisplayName="条件分支节点"),
	BossIntro UMETA(DisplayName="Boss 开场对白节点")
};
```

目前真正用到的其实主要是普通对白、选项和结束节点。`Reward`、`Branch`、`BossIntro` 更偏向后续扩展。这里先定义出来，是为了让数据结构一开始就知道未来可能会接什么，但不代表这些功能现在都已经实现了。

触发方式也先列出来：

```cpp
UENUM(BlueprintType)
enum class EDialogueTriggerMode : uint8
{
	ManualInteract UMETA(DisplayName="手动交互触发"),
	AutoOnOverlap UMETA(DisplayName="进入范围自动触发"),
	ForcedBeforeCombat UMETA(DisplayName="战斗前强制触发"),
	BossIntro UMETA(DisplayName="Boss 开场触发"),
	ScriptedOnly UMETA(DisplayName="仅脚本触发")
};
```

当前最基础的触发方式就是 `ManualInteract`，也就是玩家按 E 交互。后续如果要做进入范围自动对话、Boss 战前强制对白，也可以接在这个枚举上。

条件类型：

```cpp
UENUM(BlueprintType)
enum class EDialogueConditionType : uint8
{
	QuestStateIs UMETA(DisplayName="任务状态满足"),
	ObjectiveCompleted UMETA(DisplayName="任务目标已完成"),
	HasItem UMETA(DisplayName="持有指定物品"),
	GlobalFlagIs UMETA(DisplayName="全局旗标满足"),
	DialogueNodeSeen UMETA(DisplayName="已看过指定对白节点"),
	PuzzleSolved UMETA(DisplayName="谜题已解开"),
	BossStateIs UMETA(DisplayName="Boss 状态满足")
};
```

这里现在已经实现的只有两个：

- `GlobalFlagIs`
- `DialogueNodeSeen`

其他条件现在只是“系统知道未来可能需要它”，还没真正落地。

效果类型：

```cpp
UENUM(BlueprintType)
enum class EDialogueEffectType : uint8
{
	StartQuest UMETA(DisplayName="开始任务"),
	SetQuestState UMETA(DisplayName="设置任务状态"),
	AddObjectiveProgress UMETA(DisplayName="增加目标进度"),
	SetGlobalFlag UMETA(DisplayName="设置全局旗标"),
	GiveItem UMETA(DisplayName="给予物品"),
	RemoveItem UMETA(DisplayName="移除物品"),
	GrantReward UMETA(DisplayName="发放奖励"),
	StartBossEncounter UMETA(DisplayName="启动 Boss 遭遇战"),
	BroadcastWorldEvent UMETA(DisplayName="广播世界事件"),
	CloseDialogue UMETA(DisplayName="关闭对话"),
	SaveGame UMETA(DisplayName="保存游戏")
};
```

这里也是一样，当前真正实现的是：

- `SetGlobalFlag`
- `CloseDialogue`

这两个很小，但是已经足够验证“点击选项之后，系统真的能改变状态或者关闭对话”。

任务状态暂时这么定义：

```cpp
UENUM(BlueprintType)
enum class EQuestState : uint8
{
	NotStarted UMETA(DisplayName="未开始"),
	Active UMETA(DisplayName="进行中"),
	ReadyToTurnIn UMETA(DisplayName="可交付"),
	Completed UMETA(DisplayName="已完成"),
	RewardClaimed UMETA(DisplayName="奖励已领取"),
	Failed UMETA(DisplayName="已失败")
};
```

这部分现在更多是为后续任务系统做准备。当前对话闭环跑通后，下一步比较自然的推进顺序就是：`StartQuest -> QuestStateIs -> AddObjectiveProgress -> GrantReward`。

## 3 DialogueType STRUCT 部分

主要结构有这些。

### 3.1 DialogueCondition

`FDialogueCondition` 是一条“是否满足”的判断规则。

比如：

- 某个任务是否已经开始；
- 某个全局旗标是否为 true；
- 玩家是否看过某个对话节点；
- 玩家是否拥有某个道具。

当前最小实现只支持 `GlobalFlagIs` 和 `DialogueNodeSeen`。这也是为了先把选项筛选跑通。

### 3.2 DialogueEffect

`FDialogueEffect` 是一条“要做什么”的规则。

它可以挂在选项上，也可以后续挂在节点进入时：

- 点击选项后开始任务；
- 点击选项后设置旗标；
- 点击选项后关闭对话；
- 点击选项后给物品；
- 点击选项后触发 Boss 战。

我现在先只做 `SetGlobalFlag` 和 `CloseDialogue`，因为它们刚好能验证最小闭环。

### 3.3 FDialogueOption

`FDialogueOption` 是玩家能点的一条对话选项。

```cpp
USTRUCT(BlueprintType)
struct ESCAPEGAME_API FDialogueOption
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	FGameplayTag OptionID;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	FText OptionText;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	TArray<FDialogueCondition> Conditions;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	TArray<FDialogueEffect> Effects;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	FGameplayTag NextNodeID;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	bool bCloseDialogueAfterSelected = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	bool bHideWhenUnavailable = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	int32 SortOrder = 0;
};
```

我觉得这个结构比较关键，因为它把一条选项会发生什么都收在一起了：

- `Conditions` 决定它能不能显示；
- `Effects` 决定点下去之后要执行什么；
- `NextNodeID` 决定点完之后跳到哪里；
- `bCloseDialogueAfterSelected` 决定点完之后是否直接结束。

这样选项就不是一个单纯的 UI 按钮，而是对话流程里的一个小分支。

### 3.4 FDialogueNode

`FDialogueNode` 是对话树里的一个节点。

```cpp
USTRUCT(BlueprintType)
struct ESCAPEGAME_API FDialogueNode
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	FGameplayTag NodeID;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	FGameplayTag SpeakerID;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	FText SpeakerText;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	EDialogueNodeType NodeType = EDialogueNodeType::Line;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	TArray<FDialogueCondition> Conditions;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	TArray<FDialogueOption> Options;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	TArray<FDialogueEffect> OnEnterEffects;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	FInterruptPolicy InterruptPolicy;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	bool bAllowSkip = true;
};
```

这个节点本身只是一份数据。它不会自己推动流程。

真正推动流程的是 `DialogueQuestSubsystem`：它根据当前 `ActiveSession.CurrentNodeID` 找到当前节点，然后 UI 再根据这个节点显示文本和选项。

### 3.5 FConversationSession

`FConversationSession` 表示当前正在进行的一次对话。

它只存在于运行时，用来回答：

- 当前是不是正在对话；
- 当前跟哪个 NPC 对话；
- 当前是哪一段 Dialogue；
- 当前显示到哪个 Node；
- 上一次点了哪个 Option；
- 这次对话能不能跳过、是否锁玩家。

这个结构存在之后，UI 就不用自己保存流程状态了。

### 3.6 FDialogueRuntimeState

`FDialogueRuntimeState` 记录某段对话的长期进度。

比如：

- 玩家是否看过这段对话；
- 玩家看过哪些节点；
- 玩家点过哪些选项；
- 最近一次和谁说过话。

这部分后续可以进入存档。

### 3.7 FGlobalFlagState

全局旗标用来记录跨对话、跨任务都会关心的世界状态。

比如：

- 某个门是否打开；
- 某个 NPC 是否见过；
- 某个 Boss 是否死亡；
- 某个剧情分支是否触发。

```cpp
USTRUCT(BlueprintType)
struct ESCAPEGAME_API FGlobalFlagState
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	FGameplayTag FlagID;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	bool bValue = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	int32 NumericValue = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	FText TextValue;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
	float LastChangedTimeSeconds = 0.0f;
};
```

这里我之前有一个地方容易说不清：这个 `FlagID` 不是去玩家身上找一个 Tag。

它只是 `GlobalFlagMap` 里的 Key。

```cpp
TMap<FGameplayTag, FGlobalFlagState> GlobalFlagMap;
```

也就是说，`GlobalFlagIs` 判断的是 Dialogue/Quest 系统自己维护的世界状态表，而不是 `PlayerActor->ActorHasTag()`。

## 4 DialogueParticipantComponent

`DialogueParticipantComponent` 主要存一个可对话对象的基础信息：

```cpp
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
FGameplayTag ParticipantID;

UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
FText DisplayName;

UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
TSoftObjectPtr<UTexture2D> Portrait;

UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
FGameplayTag DefaultStartNodeID;

UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
TSoftObjectPtr<UDialogueDefinition> DialogueDefinition;
```

还有一些运行时行为配置，例如是否可以对话、是否锁住玩家、是否看向玩家、是否战斗前强制对白等。

我把这些放在 Component 里，是因为“能对话”不应该只属于 NPC。后面一个机关、一个门、一个可调查物体，也可以挂这个组件来复用对话逻辑。

## 5 DialogueQuestSubsystem

这个类目前是对话和任务系统最核心的部分。

它里面主要有这些运行时数据：

```cpp
// 当前正在进行的对话会话。
UPROPERTY(Transient)
FConversationSession ActiveSession;

// 对话运行时进度缓存。
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
TMap<FGameplayTag, FDialogueRuntimeState> DialogueRuntimeMap;

// 任务运行时进度缓存。
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
TMap<FGameplayTag, FQuestRuntimeState> QuestRuntimeMap;

// 全局旗标缓存。
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue")
TMap<FGameplayTag, FGlobalFlagState> GlobalFlagMap;

// 已加载的对话资产缓存。
UPROPERTY(Transient)
TMap<FGameplayTag, TObjectPtr<UDialogueDefinition>> LoadedDialogueDefinitions;

// 当前正在对话的参与者组件。
UPROPERTY(Transient)
TObjectPtr<UDialogueParticipantComponent> ActiveParticipantComponent;
```

一开始看这些 Map 可能有点多，但其实它们分工还算清楚：

- `DialogueRuntimeMap` 管“对话进度”；
- `QuestRuntimeMap` 管“任务进度”；
- `GlobalFlagMap` 管“世界状态”；
- `LoadedDialogueDefinitions` 管“已经加载过的对话资产”；
- `ActiveSession` 管“当前这一刻正在进行的对话”。

下面是几个核心函数。

## 6 Subsystem 实现讲解

### 6.1 StartConversation

`StartConversation` 做的事情是：尝试从某个对话参与者身上开启一段对话。

它并不负责创建 UI。它只负责建立运行时会话，然后广播 `OnConversationStarted`。UI 或 PlayerController 可以监听这个广播，再去创建 Widget。

```cpp
bool UDialogueQuestSubsystem::StartConversation(AActor* Instigator, UDialogueParticipantComponent* Participant)
{
	if (!IsValid(Instigator))
	{
		UE_LOG(LogTemp, Error, TEXT("StartConversation 失败：Instigator 无效。"));
		return false;
	}

	if (!IsValid(Participant))
	{
		UE_LOG(LogTemp, Error, TEXT("StartConversation 失败：Participant 无效。"));
		return false;
	}

	if (!Participant->bCanTalk)
	{
		UE_LOG(LogTemp, Error, TEXT("StartConversation 失败：Participant 当前不允许对话。Owner=%s"),
			*GetNameSafe(Participant->GetOwner()));
		return false;
	}

	if (bConversationOpen)
	{
		UE_LOG(LogTemp, Error, TEXT("StartConversation 失败：当前已有对话正在进行。"));
		return false;
	}

	if (Participant->DialogueDefinition.IsNull())
	{
		UE_LOG(LogTemp, Error, TEXT("StartConversation 失败：Participant 未配置 DialogueDefinition。Owner=%s"),
			*GetNameSafe(Participant->GetOwner()));
		return false;
	}

	UDialogueDefinition* DialogueAsset = Participant->DialogueDefinition.LoadSynchronous();
	if (!IsValid(DialogueAsset))
	{
		UE_LOG(LogTemp, Error, TEXT("StartConversation 失败：DialogueDefinition 加载失败。Owner=%s"),
			*GetNameSafe(Participant->GetOwner()));
		return false;
	}

	const FGameplayTag StartNodeID = Participant->DefaultStartNodeID.IsValid()
		? Participant->DefaultStartNodeID
		: DialogueAsset->StartNodeID;

	if (!StartNodeID.IsValid())
	{
		UE_LOG(LogTemp, Error, TEXT("StartConversation 失败：未配置有效起始节点。DialogueID=%s"),
			*DialogueAsset->DialogueID.ToString());
		return false;
	}

	LoadedDialogueDefinitions.Add(DialogueAsset->DialogueID, DialogueAsset);

	ActiveSession = FConversationSession();
	ActiveSession.SessionId = FGuid::NewGuid();
	ActiveSession.NPC_ID = Participant->ParticipantID;
	ActiveSession.DialogueID = DialogueAsset->DialogueID;
	ActiveSession.CurrentNodeID = StartNodeID;
	ActiveSession.bIsActive = true;
	ActiveSession.bLockPlayer = Participant->bLockPlayer;
	ActiveSession.bCanSkip = Participant->bCanSkip;
	ActiveSession.InterruptPolicy = Participant->DefaultInterruptPolicy;
	ActiveSession.StartTimeSeconds = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.0f;

	bConversationOpen = true;

	FDialogueRuntimeState& State = DialogueRuntimeMap.FindOrAdd(ActiveSession.DialogueID);
	State.DialogueID = ActiveSession.DialogueID;
	State.bHasSeenDialogue = true;
	State.CurrentNodeID = StartNodeID;
	State.LastTalkPartnerID = Participant->ParticipantID;
	State.SeenNodeIDs.Add(StartNodeID);

	ActiveParticipantComponent = Participant;

	OnConversationStarted.Broadcast(ActiveSession);

	return true;
}
```

这段函数的流程其实挺固定：

先检查参数，再检查是否能对话，再加载资产，再确定起始节点，最后写入 `ActiveSession` 和 `DialogueRuntimeMap`。

我现在觉得这里比较重要的设计点是：**对话是否开始成功，应该由 Subsystem 决定，而不是 UI 决定。**

### 6.2 GetCurrentNode

`GetCurrentNode` 根据当前会话里的 `CurrentNodeID`，去已经加载的 `DialogueDefinition` 里找到对应节点。

```cpp
FDialogueNode UDialogueQuestSubsystem::GetCurrentNode() const
{
	if (!IsConversationActive())
	{
		UE_LOG(LogTemp, Error, TEXT("GetCurrentNode 失败：当前没有激活的对话。"));
		return FDialogueNode();
	}

	const TObjectPtr<UDialogueDefinition>* DialogueDefinitionPtr =
		LoadedDialogueDefinitions.Find(ActiveSession.DialogueID);

	if (!DialogueDefinitionPtr || !IsValid(DialogueDefinitionPtr->Get()))
	{
		UE_LOG(LogTemp, Error, TEXT("GetCurrentNode 失败：未找到已加载的对话资产。DialogueID=%s"),
			*ActiveSession.DialogueID.ToString());
		return FDialogueNode();
	}

	const FDialogueNode* FoundNode = DialogueDefinitionPtr->Get()->Nodes.FindByPredicate(
		[this](const FDialogueNode& Node)
		{
			return Node.NodeID == ActiveSession.CurrentNodeID;
		});

	if (!FoundNode)
	{
		UE_LOG(LogTemp, Error, TEXT("GetCurrentNode 失败：对话资产中找不到节点。NodeID=%s"),
			*ActiveSession.CurrentNodeID.ToString());
		return FDialogueNode();
	}

	return *FoundNode;
}
```

这也是为什么 UI 不需要自己保存“当前显示到哪里了”。UI 每次刷新时问 Subsystem 要当前节点就行。

### 6.3 GetAvailableOptions

`GetAvailableOptions` 做的是最小条件筛选。

它会遍历当前节点的所有选项，只把条件全部满足的选项返回给 UI。

```cpp
TArray<FDialogueOption> UDialogueQuestSubsystem::GetAvailableOptions() const
{
	if (!IsConversationActive())
	{
		UE_LOG(LogTemp, Error, TEXT("GetAvailableOptions 失败：当前没有激活的对话。"));
		return TArray<FDialogueOption>();
	}

	const FDialogueNode CurrentNode = GetCurrentNode();
	if (!CurrentNode.NodeID.IsValid())
	{
		UE_LOG(LogTemp, Error, TEXT("GetAvailableOptions 失败：当前节点无效。"));
		return TArray<FDialogueOption>();
	}

	TArray<FDialogueOption> AvailableOptions;
	for (const FDialogueOption& Option : CurrentNode.Options)
	{
		bool bAllConditionsPassed = true;

		for (const FDialogueCondition& Condition : Option.Conditions)
		{
			if (!EvaluateCondition(Condition))
			{
				bAllConditionsPassed = false;
				break;
			}
		}

		if (bAllConditionsPassed)
		{
			AvailableOptions.Add(Option);
		}
	}

	return AvailableOptions;
}
```

这里我觉得比较舒服的一点是：UI 不用关心条件怎么判断。它只负责拿到数组，然后生成按钮。

### 6.4 SelectOption

`SelectOption` 是目前整个对话闭环里最关键的函数。

它做的事是：

1. 检查当前是否有激活对话；
2. 找到玩家点的选项；
3. 记录这次选择；
4. 执行这个选项上的 `Effects`；
5. 如果对话还没关闭，就根据 `NextNodeID` 跳转。

```cpp
bool UDialogueQuestSubsystem::SelectOption(FGameplayTag OptionID)
{
	if (!IsConversationActive())
	{
		UE_LOG(LogTemp, Error, TEXT("SelectOption 失败：当前没有激活的对话。"));
		return false;
	}

	if (!OptionID.IsValid())
	{
		UE_LOG(LogTemp, Error, TEXT("SelectOption 失败：OptionID 无效。"));
		return false;
	}

	FDialogueNode CurrentNode = GetCurrentNode();
	if (!CurrentNode.NodeID.IsValid())
	{
		UE_LOG(LogTemp, Error, TEXT("SelectOption 失败：CurrentNode 无效。"));
		return false;
	}

	const FDialogueOption* SelectedOption = CurrentNode.Options.FindByPredicate(
		[OptionID](const FDialogueOption& Option)
		{
			return Option.OptionID == OptionID;
		});

	if (!SelectedOption)
	{
		UE_LOG(LogTemp, Error, TEXT("SelectOption 失败：无效选项。"));
		return false;
	}

	ActiveSession.LastSelectedOptionID = OptionID;

	FDialogueRuntimeState& State = DialogueRuntimeMap.FindOrAdd(ActiveSession.DialogueID);
	State.DialogueID = ActiveSession.DialogueID;
	State.bHasSeenDialogue = true;
	State.CurrentNodeID = ActiveSession.CurrentNodeID;
	State.LastTalkPartnerID = ActiveSession.NPC_ID;
	State.VisitedOptionIDs.Add(OptionID);

	for (const FDialogueEffect& Effect : SelectedOption->Effects)
	{
		ApplyEffect(Effect);

		if (!IsConversationActive())
		{
			return true;
		}
	}

	if (SelectedOption->bCloseDialogueAfterSelected)
	{
		return EndConversation(EInterruptReason::NormalEnd);
	}

	if (!SelectedOption->NextNodeID.IsValid())
	{
		UE_LOG(LogTemp, Warning, TEXT("SelectOption 成功：选项没有 NextNodeID，保持当前节点。OptionID=%s"),
			*OptionID.ToString());
		return true;
	}

	ActiveSession.CurrentNodeID = SelectedOption->NextNodeID;
	State.CurrentNodeID = SelectedOption->NextNodeID;
	State.SeenNodeIDs.Add(SelectedOption->NextNodeID);

	return true;
}
```

这里有一个之前很容易漏掉的点：执行 `ApplyEffect` 之后，对话可能已经被关闭了。

比如某个选项的效果就是 `CloseDialogue`。这种情况下如果后面还继续走 `NextNodeID`，逻辑就会很奇怪。所以每执行完一个 Effect，都要检查一次 `IsConversationActive()`。

### 6.5 EvaluateCondition

当前 `EvaluateCondition` 只支持两个条件。

第一个是 `GlobalFlagIs`：

```cpp
case EDialogueConditionType::GlobalFlagIs:
{
	const FGlobalFlagState* FlagState = GlobalFlagMap.Find(Condition.FlagID);
	if (!FlagState)
	{
		UE_LOG(LogTemp, Warning, TEXT("EvaluateCondition GlobalFlagIs 失败：找不到 FlagID=%s。"),
			*Condition.FlagID.ToString());
		bResult = false;
		break;
	}

	bResult = FlagState->bValue == Condition.ExpectedBoolValue;
	break;
}
```

这个条件查的是 `GlobalFlagMap`。也就是说，如果之前某个选项执行了 `SetGlobalFlag`，后面的选项就可以通过 `GlobalFlagIs` 判断它。

第二个是 `DialogueNodeSeen`：

```cpp
case EDialogueConditionType::DialogueNodeSeen:
{
	const FDialogueRuntimeState* DialogueState = DialogueRuntimeMap.Find(ActiveSession.DialogueID);
	if (!DialogueState)
	{
		UE_LOG(LogTemp, Warning, TEXT("EvaluateCondition DialogueNodeSeen 失败：找不到 DialogueID=%s 的运行时状态。"),
			*ActiveSession.DialogueID.ToString());
		bResult = false;
		break;
	}

	const bool bHasSeenNode = DialogueState->SeenNodeIDs.Contains(Condition.ExpectedTagValue);
	bResult = bHasSeenNode == Condition.ExpectedBoolValue;
	break;
}
```

它查的是当前对话的运行时状态，判断某个节点是否已经看过。

最后再统一处理反转：

```cpp
return Condition.bInvert ? !bResult : bResult;
```

这个 `bInvert` 很实用。比如“没有见过某节点”“某旗标不是 true”这种条件，就不用再单独加一个枚举。

### 6.6 ApplyEffect

`ApplyEffect` 根据传入的 `EffectType` 执行对应效果。

当前实现很小：

```cpp
void UDialogueQuestSubsystem::ApplyEffect(const FDialogueEffect& Effect)
{
	switch (Effect.EffectType)
	{
	case EDialogueEffectType::SetGlobalFlag:
		{
			if (!Effect.FlagID.IsValid())
			{
				UE_LOG(LogTemp, Error, TEXT("ApplyEffect SetGlobalFlag 失败：FlagID 无效。"));
				return;
			}

			FGlobalFlagState& FlagState = GlobalFlagMap.FindOrAdd(Effect.FlagID);
			FlagState.FlagID = Effect.FlagID;
			FlagState.bValue = Effect.BoolValue;
			FlagState.LastChangedTimeSeconds = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.0f;
			return;
		}

	case EDialogueEffectType::CloseDialogue:
		{
			if (!IsConversationActive())
			{
				UE_LOG(LogTemp, Warning, TEXT("ApplyEffect CloseDialogue 跳过：当前没有激活的对话。"));
				return;
			}

			EndConversation(EInterruptReason::NormalEnd);
			return;
		}

	default:
		UE_LOG(LogTemp, Warning, TEXT("ApplyEffect 不支持的效果类型：EffectType=%d。"),
			static_cast<int32>(Effect.EffectType));
		return;
	}
}
```

一开始我也会有一种冲动：既然枚举都列出来了，那就把 `StartQuest`、`GiveItem`、`GrantReward` 全部写掉。

但是这样很容易变成“看起来写了很多，实际上每个都没有被验证”。所以现在先只做两个最小效果：

- `SetGlobalFlag`：证明选项可以改变世界状态；
- `CloseDialogue`：证明选项可以结束当前对话。

这个闭环通过之后，再加任务系统会稳很多。

### 6.7 EndConversation

结束对话的时候，不只是把窗口关掉。

Subsystem 还需要把当前状态写回运行时记录，然后广播对话结束事件。

```cpp
bool UDialogueQuestSubsystem::EndConversation(EInterruptReason Reason)
{
	if (!IsConversationActive())
	{
		UE_LOG(LogTemp, Error, TEXT("EndConversation 失败：当前没有激活的对话。"));
		return false;
	}

	if (ActiveSession.DialogueID.IsValid())
	{
		FDialogueRuntimeState& State = DialogueRuntimeMap.FindOrAdd(ActiveSession.DialogueID);
		State.DialogueID = ActiveSession.DialogueID;
		State.LastTalkPartnerID = ActiveSession.NPC_ID;
		State.bHasSeenDialogue = true;

		if (ActiveSession.CurrentNodeID.IsValid())
		{
			State.CurrentNodeID = ActiveSession.CurrentNodeID;
			State.SeenNodeIDs.Add(ActiveSession.CurrentNodeID);
		}
	}

	ActiveSession.InterruptReason = Reason;
	ActiveSession.bIsActive = false;
	bConversationOpen = false;

	OnConversationEnded.Broadcast(Reason);
	ActiveParticipantComponent = nullptr;

	return true;
}
```

这样 UI 层就可以很简单：监听 `OnConversationEnded`，然后隐藏或移除 Widget。

## 7 UI 部分

UI 这边我现在做得比较朴素。

`WBP_Dialogue` 里面大概有：

- `SpeakerNameTextBlock`
- `SpeakerContentTextBlock`
- `OptionsBox`

然后再做一个单独的 `WBP_DialogueOption`，里面放一个按钮和文本。

这里有个点我之前也想了一下：动态创建选项按钮的话，WBP 里就不需要提前拖三个 OptionWidget。因为每个节点有几个选项是不固定的。

正确的方式更像这样：

```text
刷新对话 UI
  -> 清空 OptionsBox
  -> 调用 GetAvailableOptions
  -> 遍历选项数组
  -> CreateWidget<WBP_DialogueOption>
  -> 绑定点击事件
  -> AddChild 到 OptionsBox
```

也就是说，`WBP_DialogueOption` 是模板，不是手动摆死在界面上的固定控件。

## 8 当前已经跑通的最小闭环

目前实际已经跑通的是：

1. 玩家按 E 和 NPC 交互；
2. 交互组件扫到 NPC；
3. NPC 身上有 `DialogueParticipantComponent`；
4. 调用 `StartConversation`；
5. UI 弹出；
6. UI 显示当前节点文本；
7. UI 根据 `GetAvailableOptions` 生成选项；
8. 点击选项调用 `SelectOption`；
9. 选项可以执行 `SetGlobalFlag`；
10. 选项可以执行 `CloseDialogue`；
11. 选项也可以通过 `NextNodeID` 跳到下一个节点。

这个阶段看起来功能还很少，但是它已经把最重要的链路打通了：

**数据资产 -> Subsystem -> UI -> 玩家点击 -> Subsystem 状态变化 -> UI 刷新/关闭**

我觉得这个闭环比一口气写完任务奖励系统更重要。因为只要这个通了，后面的任务、背包、奖励基本都可以当作新的 `Effect` 慢慢接进去。

## 9 后续还需要做什么

现在还没落地的模块主要有：

- `StartQuest`

  点击选项之后创建任务运行时状态。

- `QuestStateIs`

  根据任务状态决定某些选项是否出现。

- `AddObjectiveProgress`

  推进任务目标进度，比如收集道具、击杀敌人、触发机关。

- `GiveItem / RemoveItem`

  和背包系统打通。

- `GrantReward`

  任务完成后发奖励。

- `OnEnterEffects`

  进入某个节点时自动执行效果。

- `SaveGame`

  把 `RuntimeMap` 转成存档记录，再从存档记录恢复回来。

- 中断策略

  离开范围、打开菜单、死亡、进入战斗时，对话应该暂停、结束还是继续。

- Boss / Encounter

  对话结束后触发战斗，或者战斗前强制播放某段对白。

后面倾向于做：

```text
对话闭环
  -> StartQuest
  -> QuestStateIs
  -> AddObjectiveProgress
  -> GrantReward
  -> SaveGame
```

也就是每次只推进一个小闭环，不把所有功能一起塞进去。

## 10 小结

这次做下来，我感觉这个系统最重要的不是结构体写了多少，也不是枚举列得多完整，而是先把边界划清楚：

- `DialogueDefinition` 只描述对话内容；
- `DialogueParticipantComponent` 只描述谁能参与对话；
- `DialogueQuestSubsystem` 负责运行时流程和状态；
- `Widget` 只负责展示和把点击传回 Subsystem；
- `Effect` 负责把对话和任务、奖励、世界状态连接起来。

一开始我会很自然地想把“对话、任务、奖励、存档”放在一起想，但真正写的时候还是要拆成一个个能验证的小闭环。

当前这个版本还远远不是完整系统，不过至少已经不是纸面设计了。它已经能在关卡里完成一次真实的 NPC 对话流程，这对后续继续接任务系统来说就够了。
