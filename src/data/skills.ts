// Skill data configuration file
// Used to manage data for the skill display page

export interface Skill {
	id: string;
	name: string;
	description: string;
	icon: string; // Iconify icon name
	category: "frontend" | "backend" | "database" | "tools" | "other";
	level: "beginner" | "intermediate" | "advanced" | "expert";
	experience: {
		years: number;
		months: number;
	};
	projects?: string[]; // Related project IDs
	certifications?: string[];
	color?: string; // Skill card theme color
}

export const skillsData: Skill[] = [
    // Backend Skills (或者可以把 C++ 归类到这附近)
    {
        id: "lang-cpp",
        name: "C++",
        description: "用于游戏底层逻辑与引擎组件开发的核心语言。",
        icon: "logos:c-plusplus", // Iconify 中的 C++ 图标
        category: "backend", // 如果没有 gameDev 分类，暂时放在 backend 或 other
        level: "intermediate",
        experience: {
            years: 1,
            months: 5
        },
        color: "#00599C"
    },

    // Tools
    {
        id: "tool-rider",
        name: "JetBrains Rider",
        description: "日常进行 UE5 游戏开发的现代智能 IDE。",
        icon: "logos:rider", 
        category: "tools",
        level: "intermediate",
        experience: {
            years: 0,
            months: 6
        },
        color: "#E11352" // Rider 的主题红
    },
    
    // Other (游戏引擎/图形学等暂归于此)
    {
        id: "engine-ue5",
        name: "Unreal Engine 5",
        description: "专注于非真实感渲染(NPR)、材质节点与特效制作。",
        icon: "simple-icons:unrealengine", 
        category: "other",
        level: "intermediate",
        experience: {
            years: 0,
            months: 8
        },
        projects: ["escape-game-demo"], // 关联主人正在做的小 demo
        color: "#0E1128"
    }
];
