import React from 'react';
import { getInitials } from '../utils/textPlaceholder';

type Props = {
	product: { title?: string; images?: { url?: string }[] };
	width?: number | string;
	height?: number | string;
	borderRadius?: number;
};

export default function ProductImage({ product, width = '100%', height = 200, borderRadius = 8 }: Props) {
	const url = product?.images?.[0]?.url;

	if (url) {
		return (
			<img
				src={url}
				alt={product?.title || 'Product'}
				style={{ width, height, objectFit: 'cover', borderRadius }}
				onError={(e) => {
					// Hide broken images and fallback to text-only block by replacing the element
					const target = e.currentTarget as HTMLImageElement;
					target.style.display = 'none';
					target.insertAdjacentElement(
						'afterend',
						createTextFallback(product?.title, width, height, borderRadius)
					);
				}}
			/>
		);
	}

	return createTextFallback(product?.title, width, height, borderRadius);
}

function createTextFallback(
	title: string | undefined,
	width: number | string,
	height: number | string,
	borderRadius: number
): any {
	const initials = getInitials(title);
	return (
		<div
			role="img"
			aria-label={`Placeholder for ${title || 'Product'}`}
			style={{
				width,
				height,
				borderRadius,
				background: '#334155',
				color: '#fff',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontWeight: 700,
				fontSize: typeof height === 'number' ? Math.max(24, Number(height) / 3) : 48,
				letterSpacing: 1,
			}}
		>
			{initials}
		</div>
	);
}


