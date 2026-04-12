'use client';

import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { PushNotificationItem, FreshmenMilestone } from '@/app/services/admin';

const CATEGORY_COLORS: Record<string, string> = {
	matching: '#ec4899',
	engagement: '#8b5cf6',
	community: '#06b6d4',
	chat: '#10b981',
	admin: '#f59e0b',
	reward: '#f97316',
	support: '#6366f1',
	campaign: '#ef4444',
	payment: '#14b8a6',
	system: '#64748b',
};

interface GraphNode {
	id: string;
	type: 'center' | 'category' | 'event' | 'variant' | 'milestone';
	label: string;
	position: [number, number, number];
	color: string;
	size: number;
	parentId?: string;
	dynamic?: boolean;
	variantCount?: number;
}

interface GraphEdge {
	from: [number, number, number];
	to: [number, number, number];
	color: string;
}

function buildGraph(
	notifications: PushNotificationItem[],
	milestones: FreshmenMilestone[],
	categories: string[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
	const nodes: GraphNode[] = [];
	const edges: GraphEdge[] = [];

	// Center node
	nodes.push({
		id: 'center',
		type: 'center',
		label: 'Push Notifications',
		position: [0, 0, 0],
		color: '#ffffff',
		size: 0.6,
	});

	// Group by category
	const grouped: Record<string, PushNotificationItem[]> = {};
	for (const n of notifications) {
		if (!grouped[n.category]) grouped[n.category] = [];
		grouped[n.category].push(n);
	}

	const usedCategories = Object.keys(grouped);
	const catCount = usedCategories.length;
	const catRadius = 5;

	usedCategories.forEach((cat, catIdx) => {
		const catAngle = (catIdx / catCount) * Math.PI * 2 - Math.PI / 2;
		const catPos: [number, number, number] = [
			Math.cos(catAngle) * catRadius,
			Math.sin(catAngle) * catRadius,
			0,
		];

		const catColor = CATEGORY_COLORS[cat] || '#64748b';

		nodes.push({
			id: `cat-${cat}`,
			type: 'category',
			label: cat,
			position: catPos,
			color: catColor,
			size: 0.4,
		});

		edges.push({
			from: [0, 0, 0],
			to: catPos,
			color: catColor,
		});

		// Event nodes around category
		const events = grouped[cat];
		const eventRadius = 2.5;
		events.forEach((evt, evtIdx) => {
			const evtAngle =
				catAngle + ((evtIdx - (events.length - 1) / 2) / Math.max(events.length, 1)) * (Math.PI / 2.5);
			const evtZ = (evtIdx % 2 === 0 ? 1 : -1) * (0.3 + Math.random() * 0.5);
			const evtPos: [number, number, number] = [
				catPos[0] + Math.cos(evtAngle) * eventRadius,
				catPos[1] + Math.sin(evtAngle) * eventRadius,
				evtZ,
			];

			nodes.push({
				id: evt.eventType,
				type: 'event',
				label: evt.eventType.replace(/_/g, '\n'),
				position: evtPos,
				color: catColor,
				size: evt.dynamic ? 0.25 : 0.2,
				parentId: `cat-${cat}`,
				dynamic: evt.dynamic,
				variantCount: evt.variants?.length || 0,
			});

			edges.push({
				from: catPos,
				to: evtPos,
				color: catColor,
			});

			// Variant nodes
			if (evt.variants && evt.variants.length > 0) {
				const varRadius = 1.2;
				evt.variants.forEach((v, vIdx) => {
					const vAngle =
						evtAngle + ((vIdx - (evt.variants!.length - 1) / 2) / Math.max(evt.variants!.length, 1)) * 0.6;
					const vPos: [number, number, number] = [
						evtPos[0] + Math.cos(vAngle) * varRadius,
						evtPos[1] + Math.sin(vAngle) * varRadius,
						evtZ + (vIdx % 2 === 0 ? 0.4 : -0.4),
					];

					nodes.push({
						id: `${evt.eventType}-v${vIdx}`,
						type: 'variant',
						label: v.condition,
						position: vPos,
						color: catColor + '80',
						size: 0.1,
						parentId: evt.eventType,
					});

					edges.push({
						from: evtPos,
						to: vPos,
						color: catColor + '60',
					});
				});
			}
		});
	});

	// Milestone nodes (ring below)
	if (milestones.length > 0) {
		const msRadius = 3;
		milestones.forEach((ms, msIdx) => {
			const msAngle = (msIdx / milestones.length) * Math.PI * 2;
			const msPos: [number, number, number] = [
				Math.cos(msAngle) * msRadius,
				-8,
				Math.sin(msAngle) * msRadius,
			];

			nodes.push({
				id: `ms-${ms.milestone}`,
				type: 'milestone',
				label: `${ms.milestone.toLocaleString()}`,
				position: msPos,
				color: '#818cf8',
				size: 0.15,
			});
		});
	}

	return { nodes, edges };
}

function NodeSphere({
	node,
	isSelected,
	isHovered,
	onSelect,
	onHover,
}: {
	node: GraphNode;
	isSelected: boolean;
	isHovered: boolean;
	onSelect: (id: string | null) => void;
	onHover: (id: string | null) => void;
}) {
	const meshRef = useRef<THREE.Mesh>(null);
	const glowRef = useRef<THREE.Mesh>(null);
	const baseScale = node.size;
	const targetScale = useRef(baseScale);

	useEffect(() => {
		targetScale.current = isHovered || isSelected ? baseScale * 1.4 : baseScale;
	}, [isHovered, isSelected, baseScale]);

	useFrame((_, delta) => {
		if (!meshRef.current) return;
		const s = meshRef.current.scale.x;
		const t = targetScale.current;
		const next = THREE.MathUtils.lerp(s, t, 1 - Math.pow(0.001, delta));
		meshRef.current.scale.setScalar(next);

		// Pulse for dynamic nodes
		if (node.dynamic && meshRef.current) {
			const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.08;
			meshRef.current.scale.multiplyScalar(pulse);
		}

		// Glow
		if (glowRef.current) {
			const glowTarget = isSelected || isHovered ? 0.5 : 0;
			const opacity = (glowRef.current.material as THREE.MeshBasicMaterial).opacity;
			(glowRef.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(
				opacity,
				glowTarget,
				1 - Math.pow(0.001, delta),
			);
		}
	});

	const color = useMemo(() => new THREE.Color(node.color), [node.color]);

	return (
		<group position={node.position}>
			{/* Glow sphere */}
			<mesh ref={glowRef} scale={baseScale * 2.5}>
				<sphereGeometry args={[1, 16, 16]} />
				<meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
			</mesh>
			{/* Main sphere */}
			<mesh
				ref={meshRef}
				scale={baseScale}
				onClick={(e) => {
					e.stopPropagation();
					onSelect(node.type === 'event' ? node.id : null);
				}}
				onPointerEnter={(e) => {
					e.stopPropagation();
					onHover(node.id);
					document.body.style.cursor = 'pointer';
				}}
				onPointerLeave={() => {
					onHover(null);
					document.body.style.cursor = 'auto';
				}}
			>
				<sphereGeometry args={[1, node.type === 'center' ? 32 : 16, node.type === 'center' ? 32 : 16]} />
				<meshStandardMaterial
					color={color}
					emissive={color}
					emissiveIntensity={isSelected ? 0.8 : isHovered ? 0.5 : 0.2}
					roughness={0.3}
					metalness={0.4}
				/>
			</mesh>
			{/* Label */}
			{(node.type === 'category' || node.type === 'center') && (
				<Text
					position={[0, node.size + 0.3, 0]}
					fontSize={node.type === 'center' ? 0.3 : 0.22}
					color="white"
					anchorX="center"
					anchorY="bottom"
					outlineWidth={0.02}
					outlineColor="#000000"
				>
					{node.label}
				</Text>
			)}
			{/* Variant count badge */}
			{node.variantCount !== undefined && node.variantCount > 0 && (
				<>
					<mesh position={[node.size * 0.8, node.size * 0.8, 0]} scale={0.12}>
						<circleGeometry args={[1, 16]} />
						<meshBasicMaterial color="#7c3aed" />
					</mesh>
					<Text
						position={[node.size * 0.8, node.size * 0.8, 0.01]}
						fontSize={0.1}
						color="white"
						anchorX="center"
						anchorY="middle"
					>
						{String(node.variantCount)}
					</Text>
				</>
			)}
			{/* Hover label for events */}
			{isHovered && node.type === 'event' && (
				<Text
					position={[0, node.size + 0.25, 0]}
					fontSize={0.15}
					color="white"
					anchorX="center"
					anchorY="bottom"
					outlineWidth={0.02}
					outlineColor="#000000"
					maxWidth={3}
				>
					{node.id}
				</Text>
			)}
		</group>
	);
}

function Edges({ edges }: { edges: GraphEdge[] }) {
	return (
		<>
			{edges.map((edge, i) => (
				<Line
					key={i}
					points={[edge.from, edge.to]}
					color={edge.color}
					lineWidth={1}
					transparent
					opacity={0.4}
				/>
			))}
		</>
	);
}

function FloatingParticles() {
	const count = 80;
	const meshRef = useRef<THREE.InstancedMesh>(null);
	const dummy = useMemo(() => new THREE.Object3D(), []);
	const speeds = useMemo(
		() => Array.from({ length: count }, () => 0.2 + Math.random() * 0.5),
		[],
	);
	const offsets = useMemo(
		() => Array.from({ length: count }, () => Math.random() * Math.PI * 2),
		[],
	);
	const radii = useMemo(
		() => Array.from({ length: count }, () => 8 + Math.random() * 12),
		[],
	);

	useFrame(({ clock }) => {
		if (!meshRef.current) return;
		const t = clock.getElapsedTime();
		for (let i = 0; i < count; i++) {
			const angle = t * speeds[i] * 0.1 + offsets[i];
			dummy.position.set(
				Math.cos(angle) * radii[i],
				Math.sin(angle * 0.7) * 6,
				Math.sin(angle) * radii[i],
			);
			dummy.scale.setScalar(0.02 + Math.sin(t + offsets[i]) * 0.01);
			dummy.updateMatrix();
			meshRef.current.setMatrixAt(i, dummy.matrix);
		}
		meshRef.current.instanceMatrix.needsUpdate = true;
	});

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
			<sphereGeometry args={[1, 6, 6]} />
			<meshBasicMaterial color="#475569" transparent opacity={0.3} />
		</instancedMesh>
	);
}

function RotatingScene({ children }: { children: React.ReactNode }) {
	const groupRef = useRef<THREE.Group>(null);

	useFrame((_, delta) => {
		if (groupRef.current) {
			groupRef.current.rotation.y += delta * 0.03;
		}
	});

	return <group ref={groupRef}>{children}</group>;
}

function CameraController() {
	const { camera } = useThree();
	useEffect(() => {
		camera.position.set(0, 2, 16);
		camera.lookAt(0, 0, 0);
	}, [camera]);
	return null;
}

export function NotificationGraph({
	notifications,
	milestones,
	categories,
	selectedNode,
	onSelectNode,
}: {
	notifications: PushNotificationItem[];
	milestones: FreshmenMilestone[];
	categories: string[];
	selectedNode: string | null;
	onSelectNode: (id: string | null) => void;
}) {
	const [hoveredNode, setHoveredNode] = useState<string | null>(null);
	const { nodes, edges } = useMemo(
		() => buildGraph(notifications, milestones, categories),
		[notifications, milestones, categories],
	);

	return (
		<Canvas
			dpr={[1, 2]}
			gl={{ antialias: true, alpha: false }}
			onPointerMissed={() => onSelectNode(null)}
		>
			<color attach="background" args={['#0f172a']} />
			<fog attach="fog" args={['#0f172a', 15, 30]} />
			<ambientLight intensity={0.4} />
			<pointLight position={[10, 10, 10]} intensity={1} />
			<pointLight position={[-10, -5, -10]} intensity={0.3} color="#818cf8" />
			<CameraController />
			<OrbitControls
				enablePan
				enableZoom
				enableRotate
				maxDistance={30}
				minDistance={5}
				autoRotate
				autoRotateSpeed={0.3}
			/>
			<FloatingParticles />
			<Edges edges={edges} />
			{nodes.map((node) => (
				<NodeSphere
					key={node.id}
					node={node}
					isSelected={selectedNode === node.id}
					isHovered={hoveredNode === node.id}
					onSelect={onSelectNode}
					onHover={setHoveredNode}
				/>
			))}
		</Canvas>
	);
}
