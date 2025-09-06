import React from 'react';

interface ProductImageProps {
	product: { 
		title?: string; 
		images?: { 
			image_url?: string; 
			thumbnail_url?: string;
			alt_text?: string;
		}[] 
	};
	width?: number | string;
	height?: number | string;
	borderRadius?: number;
	className?: string;
}

export default function ProductImage({ 
	product, 
	width = '100%', 
	height = 200, 
	borderRadius = 8,
	className 
}: ProductImageProps) {
	const imageUrl = product?.images?.[0]?.image_url || product?.images?.[0]?.thumbnail_url;
	const altText = product?.images?.[0]?.alt_text || product?.title || 'Product';

	if (imageUrl) {
		return (
			<img
				src={imageUrl}
				alt={altText}
				className={className}
				style={{ 
					width, 
					height, 
					objectFit: 'cover', 
					borderRadius,
					display: 'block'
				}}
				onError={(e) => {
					const target = e.currentTarget as HTMLImageElement;
					target.style.display = 'none';
					target.insertAdjacentElement(
						'afterend',
						createNoImagePlaceholder(product?.title, width, height, borderRadius, className)
					);
				}}
			/>
		);
	}

	return createNoImagePlaceholder(product?.title, width, height, borderRadius, className);
}

function createNoImagePlaceholder(
	title: string | undefined,
	width: number | string,
	height: number | string,
	borderRadius: number,
	className?: string
): JSX.Element {
	const iconSize = typeof height === 'number' ? Math.max(32, Number(height) / 6) : 48;
	const fontSize = typeof height === 'number' ? Math.max(14, Number(height) / 10) : 16;

	return (
		<div
			className={className}
			role="img"
			aria-label={`No image available for ${title || 'Product'}`}
			style={{
				width,
				height,
				borderRadius,
				background: '#f8fafc',
				border: '2px dashed #cbd5e1',
				color: '#64748b',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize,
				gap: '8px',
			}}
		>
			<svg
				width={iconSize}
				height={iconSize}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
				<circle cx="8.5" cy="8.5" r="1.5"/>
				<polyline points="21,15 16,10 5,21"/>
			</svg>
			<span style={{ fontSize: '0.8em', fontWeight: 500 }}>
				No Image
			</span>
		</div>
	);
}