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
    // Galgame数据
    {
        type: "galgame",
        title: "櫻ノ詩",
        status: "completed",
        rating: 10.0, // 给神作打满分不过分吧~
        cover: "/assets/desktop-banner/MASHIRO_e102b.webp",
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
        endDate: "2024-02",
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
];

export default localMediaList;