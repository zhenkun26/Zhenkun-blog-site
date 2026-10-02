export type DynamicConfig = {
	title?: string;
	description?: string;
	/** 动态头像和名称的跳转地址，支持站内路径或完整 URL */
	profileUrl?: string;
	showComment?: boolean;
	itemsPerPage?: number;
	// 动态数据 json 地址，本地默认 "/api/dynamic.json"
	// A third-party endpoint must return the same schema as the local API.
	// 当 memos.enable 为 true 时，此配置会被忽略
	apiUrl?: string;
	// Memos 配置
	memos?: DynamicMemocsConfig;
};

export type DynamicMemocsConfig = {
	/** 是否启用 Memos 数据源 */
	enable: boolean;
	/** Memos 实例地址，如 "https://memos.example.com" */
	apiUrl: string;
	/** Memos user identifier, such as "users/YOUR_USER_ID", for creator filtering. */
	parent?: string;
};
