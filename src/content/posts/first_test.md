---
title: "UE5的修饰词用法"
description: "可理解定义变量和函数的时候，所需要修饰词起的作用"
pubDate: 2026-04-18
published: 2026-04-18
updated: 2026-04-19
category: "技术笔记"
tags: ["UE5","C++"]
---

# 📖 UE5 常用修饰词 (Specifiers) 完全指南
在 UE5 中，修饰词主要跟在四个核心宏后面：`UPROPERTY`（变量）、`UFUNCTION`（函数）、`UCLASS`（类）、`USTRUCT`（结构体）。

## 一、 `UPROPERTY` 属性修饰词 (变量专用)
这是你每天用得最多的修饰词，决定了变量在**编辑器大纲**和**蓝图图表**里的生杀大权。

### 1. 权限控制：编辑与可见 (Edit vs Visible)
> **提示**：`Edit` 代表能修改，`Visible` 代表只能看。`Anywhere` 代表所有地方，`DefaultsOnly` 代表只能在蓝图类里改，`InstanceOnly` 代表只能在关卡里的实体上改。
>

| 修饰词 | 作用域 | 核心应用场景 |
| :--- | :--- | :--- |
| `EditAnywhere` | 蓝图类面板 + 关卡实例面板 | **最自由**。如 `float BaseDamage`，策划既能在蓝图改默认值，也能在关卡里给特定怪物调高伤害。 |
| `EditDefaultsOnly` | **仅**蓝图类面板 | **最推荐的配置词**。如引用的 `UAnimMontage`。不允许在关卡里单独改，必须统一在蓝图类里改。 |
| `EditInstanceOnly` | **仅**关卡实例面板 | 如 `AActor* PatrolTarget` (巡逻目标点)。每个怪物在关卡里的路线都不同，在蓝图类里填无意义。 |
| `VisibleAnywhere` | 蓝图类面板 + 关卡实例面板 | **常用于组件指针**。如 `TObjectPtr<USphereComponent>`。只能查看组件属性，不能替换组件本体。 |
| `VisibleDefaultsOnly` | **仅**蓝图类面板 | 只能在蓝图类里看，不能改。平时极少用，通常用于 Debug 静态数据。 |
| `VisibleInstanceOnly` | **仅**关卡实例面板 | 只能在关卡里看。适合做 **Debug 面板**，如在关卡里实时查看怪物的当前 `ComboCount`。 |


### 2. 蓝图交互权 (Blueprint Read/Write)
> **提示**：如果不加这两个词，你的 C++ 变量对蓝图就是完全隐身的！
>

| 修饰词 | 蓝图权限 | 核心应用场景 |
| :--- | :--- | :--- |
| `BlueprintReadWrite` | 可读，可写 (Get/Set) | **全权交出**。如配置表里定义的 `HitVFX`，允许在蓝图里随时读取和替换。 |
| `BlueprintReadOnly` | 只能读 (Get) | **保护状态**。如私有维护的 `CurrentHealth`，允许 UI 读取画血条，但绝不允许 UI 直接修改血量！ |


### 3. 内存与序列化 (Memory & Serialization)
| 修饰词 | 核心作用 | 核心应用场景 |
| :--- | :--- | :--- |
| `Transient` | **不保存到硬盘** | 运行时的临时缓存指针（如缓存的 `UAnimInstance`）、当前连击数。每次重启游戏都会清空。 |
| `SaveGame` | **打上存档标记** | 玩家的背包数据、等级、金币。告诉存档框架“这个要塞进存档文件里”。 |


### 4. 常用元数据 (Meta Specifiers)
_用 _`meta=(...)`_ 包裹的高级语法。_

+ `meta = (AllowPrivateAccess = "true")`：**极度常用！** 将变量写在 `private` 里（如 Component 指针）又想暴露给蓝图面板时必加，否则编译器会报错。
+ `meta = (BindWidget)`：做 UI (UMG) 时必用！在 C++ 里绑定蓝图里的 UI 控件（如 `UProgressBar* HealthBar`）。

---

## 二、 `UFUNCTION` 函数修饰词 (逻辑专用)
控制 C++ 函数如何与蓝图节点交互。

### 1. 基础调用权
| 修饰词 | 蓝图表现 | 核心应用场景 |
| :--- | :--- | :--- |
| `BlueprintCallable` | **带执行销 (白线) 的节点** | 最常规的函数。比如 `DoAttackTrace()`。必须连白线才会执行。 |
| `BlueprintPure` | **没有执行销的纯节点** | 只负责返回数据，不改变对象状态。比如 `GetLockedTarget()` 或 `IsDead()`。 |


### 2. C++ 与蓝图的究极混合
> **提示**：如何让 C++ 管纯数据计算，让蓝图管酷炫表现？就靠这两个词！
>

+ `BlueprintImplementableEvent`** (BIE)**
    - **含义**：C++ 里**只写声明，绝不写实现**。具体的实现完全交给蓝图连线。
    - **用法**：比如 `void PlayHitEffect(FVector Location);`。C++ 算出位置后直接调用，蓝图接收事件生成粒子。
+ `BlueprintNativeEvent`** (BNE)**
    - **含义**：C++ 里有**保底的默认实现**，但蓝图可以**重写（Override）**它。
    - **用法**：比如声明 `void OnDeath()`，必须在 C++ 写一个 `void OnDeath_Implementation()` 处理基本逻辑。蓝图如果重写它，默认会覆盖 C++ 的逻辑（除非手动调 Parent 节点）。

---

## 三、 `UCLASS` 与 `USTRUCT` 修饰词 (类结构专用)
当你新建一个类或结构体时，写在最顶部的修饰词。

| 修饰词 | 作用域 | 核心应用场景 |
| :--- | :--- | :--- |
| `BlueprintType` | UCLASS / USTRUCT | 允许在蓝图里被当成**变量类型**来用。比如 `FActionDefinition`，不加这个词，蓝图里就搜不到它。 |
| `Blueprintable` | UCLASS 专用 | 允许策划在这个 C++ 类的基础上，**右键创建一个蓝图子类**。通常加在核心玩法类上。 |
| `Abstract` | UCLASS 专用 | **抽象类**。表示这是个基类（如 `UBaseWeapon`），不能直接拖进场景，必须用子类（如 `USword`）。 |
| `meta=(BlueprintSpawnableComponent)` | UCLASS 专用 | **极其重要！** 如果写了自定义组件（ActorComponent），必须加这个词，否则在蓝图的 "Add Component" 列表里搜不到！ |