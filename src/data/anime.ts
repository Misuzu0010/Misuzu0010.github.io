// 1. 提取共通的基础属性 (就像 C++ 里的 Base Class)

/**/
export interface BaseMediaItem {
    title: string;
    rating: number;
    cover: string;
    description: string;
    year: string;
    genre: string[];
    link: string;
    startDate: string;
    endDate: string;
}

// 2. 派生 Anime 特有属性
export interface AnimeItem extends BaseMediaItem {
    type: "anime"; // 核心：用于区分类型的标识符
    status: "watching" | "completed" | "planned";
    episodes: string;
    studio: string;
    progress: number;
    totalEpisodes: number;
}

// 3. 派生 Galgame 特有属性
export interface GalgameItem extends BaseMediaItem {
    type: "galgame"; // 核心：用于区分类型的标识符
    status: "watching" | "completed" | "planned" | "abandoned"; // Galgame 的状态通常与番剧不同
    developer: string;     // 开发商，例如：枕 (Makura), Yuzusoft
    playTime: number;      // 游玩总时长 (小时)
	currentTime: number;
    clearedRoutes: number; // 已推完的个人线数量
    totalRoutes: number;   // 总路线数量
}

// 4. 联合类型：MediaItem 可以是动漫，也可以是 Galgame
export type MediaItem = AnimeItem | GalgameItem;

// 5. 混合后的数据列表
const localMediaList: MediaItem[] = [
    // 动画数据
    {
        type: "anime",
        title: "Lycoris Recoil",
        status: "completed",
        rating: 9.8,
        cover: "/assets/anime/lkls.webp",
        description: "Girl's gunfight",
        episodes: "12 episodes",
        year: "2022",
        genre: ["Action", "Slice of life"],
        studio: "A-1 Pictures",
        link: "https://www.bilibili.com/bangumi/media/md28338623",
        progress: 12,
        totalEpisodes: 12,
        startDate: "2022-07",
        endDate: "2022-09",
    },

    {
        type: "anime",
        title: "BanG Dream! It's MyGO!!!!!",
        status: "completed",
        rating: 10.0,
        cover: "/assets/anime/mygo.webp", // 主人记得存一下图片喵
        description: "“即便迷茫也要前行”。在纠葛中寻找归宿，乐队番的新高度。灯宝的呐喊和三次元社的 NPR 渲染堪称教科书喵！",
        episodes: "13 episodes",
        year: "2023",
        genre: ["Music", "Drama", "Slice of Life"],
        studio: "BanG Dream! Project",
        link: "https://www.agedm.io/detail/20230112",
        progress: 13,
        totalEpisodes: 13,
        startDate: "",
        endDate: "",
    },
    {
        type: "anime",
        title: "BanG Dream! Ave Mujica",
        status: "completed",
        rating: 9.5,
        cover: "/assets/anime/Ave_mujica.webp",
        description: "祥子组建的神秘乐队，在虚拟与现实的夹缝中上演的黑暗华丽乐章。",
        episodes: "12 episodes",
        year: "2025",
        genre: ["Music", "Drama", "Dark"],
        studio: "BanG Dream! Project",
        link: "https://www.agedm.io/detail/20250021",
        progress: 12,
        totalEpisodes: 12,
        startDate: "2025-01",
        endDate: "2025-4",
    },
    {
        type: "anime",
        title: "关于我转生变成史莱姆这档事",
        status: "completed",
        rating: 9.4,
        cover: "/assets/anime/slime.webp",
        description: "上班族三上悟转生成为史莱姆，并在异世界通过“捕食者”能力不断进化的建国史喵！",
        episodes: "24 episodes",
        year: "2018",
        genre: ["Fantasy", "Isekai", "Adventure"],
        studio: "轉生史萊姆製作委員會",
        link: "https://www.agedm.io/detail/20180220",
        progress: 24,
        totalEpisodes: 24,
        startDate: "2026-3",
        endDate: "2026-3",
    },
    {
        type: "anime",
        title: "斩！赤红之瞳",
        status: "completed",
        rating: 9.1,
        cover: "/assets/anime/akame.webp",
        description: "为了推翻腐败统治，暗杀团 Night Raid 在暗夜中起舞。",
        episodes: "24 episodes",
        year: "2014",
        genre: ["Action", "Dark Fantasy", "Drama"],
        studio: "White Fox",
        link: "https://www.agedm.io/detail/20140029",
        progress: 24,
        totalEpisodes: 24,
        startDate: "2026-2",
        endDate: "2026-2",
    },
    {
        type: "anime",
        title: "干物妹！小埋",
        status: "completed",
        rating: 9.6,
        cover: "/assets/anime/umaru.webp",
        description: "可乐、薯片、游戏！在外面是完美少女，回到家就是超萌干物妹！",
        episodes: "12 episodes",
        year: "2015",
        genre: ["Comedy", "Slice of Life"],
        studio: "Doga Kobo",
        link: "https://www.bilibili.com/bangumi/media/md2580",
        progress: 12,
        totalEpisodes: 12,
        startDate: "2019-7",
        endDate: "2019-7",
    },
    {
        type: "anime",
        title: "约会大作战",
        status: "completed",
        rating: 9.3,
        cover: "/assets/anime/date.webp",
        description: "为了封印精灵的力量，少年必须与她们约会并让其迷恋上自己！",
        episodes: "12 episodes",
        year: "2013",
        genre: ["Harem", "Sci-Fi", "Romance"],
        studio: "AIC Plus+",
        link: "https://www.agedm.io/detail/20130009",
        progress: 12,
        totalEpisodes: 12,
        startDate: "2020-7",
        endDate: "2020-7",
    },

    // --- Galgame 部分 (图片与链接依主人要求留空) ---
    {
        type: "galgame",
        title: "euphoria",
        status: "completed",
        rating: 8.5,
        cover: "/assets/anime/Euphoria.webp",
        description: "在极端的环境中拷问人性与爱。结局的升华让它超越了普通的重口味作品，逻辑链非常严密喵。",
        year: "2011",
        genre: ["Dark Fantasy", "Psychological", "Horror"],
        developer: "CLOCKUP",
        link: "https://www.qingju.org/3555.html",
        playTime: 50,
        currentTime: 50,
        clearedRoutes: 6,
        totalRoutes: 6,
        startDate: "2024-3",
        endDate: "2024-4",
    },
    {
        type: "galgame",
        title: "穢翼のユースティア",
        status: "completed",
        rating: 9.5,
        cover: "/assets/anime/ysty.webp",
        description: "悲剧与救赎交织的史诗。八月社的艺术巅峰，关于羽翼少女与底层佣兵的抗争物语。",
        year: "2011",
        genre: ["Fantasy", "Drama", "Steampunk"],
        developer: "August",
        link: "https://www.touchgal.top/6fb97b64",
        playTime: 50,
        currentTime: 50,
        clearedRoutes: 5,
        totalRoutes: 5,
        startDate: "2023-7",
        endDate: "2023-7",
    },
    {
        type: "galgame",
        title: "アマツツミ",
        status: "completed",
        rating: 9.0,
        cover: "/assets/anime/Ama.webp",
        description: "言灵的力量能改变世界，却改变不了思念。紫社的诚意之作，感情描写非常细腻喵。",
        year: "2016",
        genre: ["Romance", "Fantasy", "Mystery"],
        developer: "Purple software",
        link: "https://www.touchgal.top/91518c25",
        playTime: 35,
        currentTime: 35,
        clearedRoutes: 4,
        totalRoutes: 4,
        startDate: "2026-1",
        endDate: "2026-2",
    },
    {
        type: "galgame",
        title: "9-nine",
        status: "completed",
        rating: 9.2,
        cover: "https://upload.wikimedia.org/wikipedia/zh/5/54/9-nine.jpg",
        description: "多平行世界交叉的悬疑恋爱剧。各个章节的伏笔回收堪称精妙，美术风格也很讨喜喵！",
        year: "2021",
        genre: ["Sci-Fi", "Supernatural", "Romance"],
        developer: "Palette",
        link: "https://www.touchgal.top/67d52a4d",
        playTime: 45,
        currentTime: 45,
        clearedRoutes: 5,
        totalRoutes: 5,
        startDate: "2021-7",
        endDate: "2021-8",
    },


    // Galgame数据
    {
        type: "galgame",
        title: "櫻ノ詩",
        status: "completed",
        rating: 10.0, // 给神作打满分不过分吧~
        cover: "/assets/anime/yzs.webp",
        description: "在樱花树下产生的奇迹与艺术的故事",
        year: "2015",
        genre: ["Visual Novel", "Art", "Romance"],
        developer: "枕 (Makura)",
        link: "https://www.touchgal.top/df2eddb6",
        playTime: 60,
		currentTime:60,
        clearedRoutes: 6,
        totalRoutes: 6,
        startDate: "2024-03",
        endDate: "2024-05",
    },
	// Summer Pockets
    {
        type: "galgame",
        title: "Summer Pockets",
        status: "completed", // 状态可以根据主人的实际情况修改哦：playing | cleared | planned | abandoned
        rating: 9.5,
        cover: "https://cdn.akamai.steamstatic.com/steam/apps/897220/library_600x900.jpg",
        description: "由 Key 社呈献的关于暑假、朋友与回忆的感人故事。在那年夏天，我遇到了在那里的你。",
        year: "2018",
        genre: ["Visual Novel", "Nakige", "Slice of Life"],
        developer: "Key",
        link: "https://store.steampowered.com/app/897220/Summer_Pockets/",
        playTime: 40,
		currentTime: 40,
        clearedRoutes: 4,
        totalRoutes: 5,
        startDate: "2025-01",
        endDate: "2025-02",
    },
    // Steins;Gate
    {
        type: "galgame",
        title: "Steins;Gate",
        status: "completed",
        rating: 10.0, // 给神作打满分是常识吧！
        cover: "https://cdn.akamai.steamstatic.com/steam/apps/412830/library_600x900.jpg",
        description: "穿越时空的观测者。为了改变既定的命运，在无数个世界线中挣扎前行的物语。",
        year: "2009",
        genre: ["Sci-Fi", "Visual Novel", "Psychological"],
        developer: "MAGES./5pb.",
        link: "https://store.steampowered.com/app/412830/STEINSGATE/",
        playTime: 50,
		currentTime: 50,
        clearedRoutes: 6,
        totalRoutes: 6,
        startDate: "2025-7",
        endDate: "2025-7",
    },

    {
        type: "galgame",
        title: "枯れない世界と終わる花",
        status: "watching",
        rating: 0.0, // 还在探索中，先不给分数喵！
        cover: "/assets/anime/bbsj.webp", // 记得替换为实际封面链接哦
        description: "在循环的终焉里寻找不败的希望。关于记忆、选择与观测者的末日物语。(tips: 需要魔法上网才能点开链接)",
        year: "2016",
        genre: ["Sci-Fi", "Visual Novel", "Mystery"],
        developer: "SWEET&TEA",
        link: "https://www.qingju.org/5931.html",
        playTime: 40, // 预计总时长
        currentTime: 4,
        clearedRoutes: 0,
        totalRoutes: 5,
        startDate: "2026-5",
        endDate: "?",
    },


];

export default localMediaList;