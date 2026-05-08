export const UTM_SOURCE_PLATFORM_OPTIONS = [
	{ value: '', label: '선택 안 함' },
	{ value: 'meta_ads', label: 'Meta Ads' },
	{ value: 'google_ads', label: 'Google Ads' },
	{ value: 'instagram', label: 'Instagram Organic' },
	{ value: 'tiktok', label: 'TikTok Organic' },
	{ value: 'app_store_search', label: 'App Store Search' },
	{ value: 'offline', label: 'Offline' },
	{ value: 'owned', label: 'Owned Channel' },
	{ value: 'referral', label: 'Referral' },
] as const;

export const UTM_CREATIVE_FORMAT_OPTIONS = [
	{ value: '', label: '선택 안 함' },
	{ value: 'image', label: 'Image' },
	{ value: 'video', label: 'Video' },
	{ value: 'carousel', label: 'Carousel' },
	{ value: 'reels', label: 'Reels / Shorts' },
	{ value: 'story', label: 'Story' },
	{ value: 'banner', label: 'Banner' },
	{ value: 'qr', label: 'QR / Poster' },
	{ value: 'text', label: 'Text' },
	{ value: 'landing', label: 'Landing Page' },
] as const;

export const UTM_MARKETING_TACTIC_OPTIONS = [
	{ value: '', label: '선택 안 함' },
	{ value: 'acquisition', label: '신규 유저 획득' },
	{ value: 'retargeting', label: '리타게팅' },
	{ value: 'campus_ambassador', label: '캠퍼스 앰배서더' },
	{ value: 'influencer', label: '인플루언서' },
	{ value: 'event', label: '이벤트' },
	{ value: 'referral', label: '추천/초대' },
	{ value: 'organic', label: '오가닉' },
	{ value: 'crm', label: 'CRM' },
	{ value: 'test', label: '테스트' },
] as const;

export const PLATFORM_BINDING_OPTIONS = [
	{ value: 'meta', label: 'Meta' },
	{ value: 'google_ads', label: 'Google Ads' },
] as const;

export const PLACEMENT_OPTIONS = [
	{ value: '', label: '선택 안 함' },
	{ value: 'instagram_feed', label: 'Instagram Feed' },
	{ value: 'instagram_stories', label: 'Instagram Stories' },
	{ value: 'instagram_reels', label: 'Instagram Reels' },
	{ value: 'facebook_feed', label: 'Facebook Feed' },
	{ value: 'audience_network', label: 'Audience Network' },
	{ value: 'google_search', label: 'Google Search' },
	{ value: 'youtube', label: 'YouTube' },
	{ value: 'display', label: 'Display Network' },
	{ value: 'campus_poster', label: 'Campus Poster' },
	{ value: 'everytime', label: 'Everytime' },
] as const;

export const SITE_SOURCE_NAME_OPTIONS = [
	{ value: '', label: '선택 안 함' },
	{ value: 'ig', label: 'Instagram (ig)' },
	{ value: 'fb', label: 'Facebook (fb)' },
	{ value: 'an', label: 'Audience Network (an)' },
	{ value: 'msg', label: 'Messenger (msg)' },
	{ value: 'google', label: 'Google' },
	{ value: 'youtube', label: 'YouTube' },
	{ value: 'offline', label: 'Offline' },
] as const;
