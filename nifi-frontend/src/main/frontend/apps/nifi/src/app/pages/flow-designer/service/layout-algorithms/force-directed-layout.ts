/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as d3 from 'd3';
import { LayoutAlgorithm, LayoutResult } from './layout-types';
import { ComponentEntity } from '../../state/flow';
import { Position } from '../../state/shared';
import { LayoutOptions } from '../auto-layout.service';

export class ForceDirectedLayoutAlgorithm implements LayoutAlgorithm {
    apply(components: ComponentEntity[], connections?: ComponentEntity[], options: LayoutOptions = {}): LayoutResult {
        const iterations = options.iterations || 100;
        const repulsionStrength = 5000; // Increased for better separation
        const attractionStrength = 0.1;
        const damping = 0.9;
        const minDistance = 120; // Minimum distance between components

        // Get component dimensions
        const getComponentSize = (comp: ComponentEntity) => {
            switch (comp.component?.type) {
                case 'Processor':
                    return { width: 160, height: 60 };
                case 'ProcessGroup':
                    return { width: 240, height: 120 };
                case 'InputPort':
                case 'OUTPUT_PORT':
                    return { width: 100, height: 40 };
                case 'Funnel':
                    return { width: 60, height: 60 };
                default:
                    return { width: 160, height: 60 };
            }
        };

        // Initialize positions
        const positions = new Map<string, Position>();
        const velocities = new Map<string, { vx: number; vy: number }>();

        components.forEach((comp, index) => {
            // Start with grid-like initial positions to reduce chaos
            const gridSize = Math.ceil(Math.sqrt(components.length));
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;

            positions.set(comp.id, {
                x: 200 + col * 200 + (Math.random() - 0.5) * 50,
                y: 200 + row * 150 + (Math.random() - 0.5) * 50
            });
            velocities.set(comp.id, { vx: 0, vy: 0 });
        });

        // Build connection map for attraction forces
        const connectionMap = new Map<string, Set<string>>();
        connections?.forEach((conn) => {
            const source = conn.component?.source;
            const destination = conn.component?.destination;

            if (source?.id && destination?.id) {
                if (!connectionMap.has(source.id)) {
                    connectionMap.set(source.id, new Set());
                }
                if (!connectionMap.has(destination.id)) {
                    connectionMap.set(destination.id, new Set());
                }
                connectionMap.get(source.id)!.add(destination.id);
                connectionMap.get(destination.id)!.add(source.id);
            }
        });

        // Force-directed simulation
        for (let iter = 0; iter < iterations; iter++) {
            const forces = new Map<string, { fx: number; fy: number }>();

            // Initialize forces
            components.forEach((comp) => {
                forces.set(comp.id, { fx: 0, fy: 0 });
            });

            // Repulsion forces (all pairs)
            for (let i = 0; i < components.length; i++) {
                for (let j = i + 1; j < components.length; j++) {
                    const comp1 = components[i];
                    const comp2 = components[j];
                    const pos1 = positions.get(comp1.id)!;
                    const pos2 = positions.get(comp2.id)!;
                    const size1 = getComponentSize(comp1);
                    const size2 = getComponentSize(comp2);

                    const dx = pos1.x - pos2.x;
                    const dy = pos1.y - pos2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance > 0) {
                        // Adjust repulsion based on component sizes
                        const avgSize = (Math.max(size1.width, size1.height) + Math.max(size2.width, size2.height)) / 2;
                        const adjustedMinDistance = minDistance + avgSize * 0.5;

                        const force = repulsionStrength / (distance * distance + 1);
                        const fx = (dx / distance) * force;
                        const fy = (dy / distance) * force;

                        const force1 = forces.get(comp1.id)!;
                        const force2 = forces.get(comp2.id)!;

                        force1.fx += fx;
                        force1.fy += fy;
                        force2.fx -= fx;
                        force2.fy -= fy;
                    }
                }
            }

            // Attraction forces (connected components)
            components.forEach((comp) => {
                const connections = connectionMap.get(comp.id);
                if (connections) {
                    connections.forEach((connectedId) => {
                        const connectedComp = components.find((c) => c.id === connectedId);
                        if (connectedComp) {
                            const pos1 = positions.get(comp.id)!;
                            const pos2 = positions.get(connectedId)!;

                            const dx = pos2.x - pos1.x;
                            const dy = pos2.y - pos1.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            if (distance > 0) {
                                const force = attractionStrength * distance;
                                const fx = (dx / distance) * force;
                                const fy = (dy / distance) * force;

                                const force1 = forces.get(comp.id)!;
                                force1.fx += fx;
                                force1.fy += fy;
                            }
                        }
                    });
                }
            });

            // Update positions
            components.forEach((comp) => {
                const pos = positions.get(comp.id)!;
                const vel = velocities.get(comp.id)!;
                const force = forces.get(comp.id)!;

                vel.vx = (vel.vx + force.fx) * damping;
                vel.vy = (vel.vy + force.fy) * damping;

                pos.x += vel.vx;
                pos.y += vel.vy;

                // Keep components in reasonable bounds
                pos.x = Math.max(50, Math.min(1500, pos.x));
                pos.y = Math.max(50, Math.min(1000, pos.y));
            });
        }

        return { positions };
    }
}
