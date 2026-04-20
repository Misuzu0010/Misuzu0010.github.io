// Project data configuration file
// Used to manage data for the project display page

export interface Project {
	id: string;
	title: string;
	description: string;
	image: string;
	category: "web" | "mobile" | "desktop" | "other";
	techStack: string[];
	status: "completed" | "in-progress" | "planned";
	liveDemo?: string;
	sourceCode?: string;
	visitUrl?: string;
	startDate: string;
	endDate?: string;
	featured?: boolean;
	tags?: string[];
	showImage?: boolean;
}

export const projectsData: Project[] = [
	// {
	// 	id: "mizuki",
	// 	title: "Mizuki",
	// 	description:
	// 		"A next-gen Material Design 3 blog theme built with Astro, featuring i18n, dark mode, and responsive design.",
	// 	image: "/assets/projects/mizuki.webp",
	// 	category: "web",
	// 	techStack: ["Astro", "TypeScript", "Tailwind CSS", "Svelte"],
	// 	status: "completed",
	// 	sourceCode: "https://github.com/LyraVoid/Mizuki",
	// 	visitUrl: "https://mizuki.mysqil.com",
	// 	startDate: "2024-01-01",
	// 	endDate: "2024-06-01",
	// 	featured: true,
	// 	tags: ["Blog", "Theme", "Open Source"],
	// },
	
];

// Get project statistics
export const getProjectStats = () => {
	const total = projectsData.length;
	const completed = projectsData.filter(
		(p) => p.status === "completed",
	).length;
	const inProgress = projectsData.filter(
		(p) => p.status === "in-progress",
	).length;
	const planned = projectsData.filter((p) => p.status === "planned").length;

	return {
		total,
		byStatus: {
			completed,
			inProgress,
			planned,
		},
	};
};

// Get projects by category
export const getProjectsByCategory = (category?: string) => {
	if (!category || category === "all") {
		return projectsData;
	}
	return projectsData.filter((p) => p.category === category);
};

// Get featured projects
export const getFeaturedProjects = () => {
	return projectsData.filter((p) => p.featured);
};

// Get all tech stacks
export const getAllTechStack = () => {
	const techSet = new Set<string>();
	projectsData.forEach((project) => {
		project.techStack.forEach((tech) => {
			techSet.add(tech);
		});
	});
	return Array.from(techSet).sort();
};
