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

import { ComponentEntity } from '../../state/flow';
import { Position } from '../../state/shared';
import { LayoutAlgorithm, LayoutResult, LayoutOptions } from './layout-types';

export class HierarchicalRootLayoutAlgorithm implements LayoutAlgorithm {
    apply(components: ComponentEntity[], connections?: ComponentEntity[], options: LayoutOptions = {}): LayoutResult {
        const rootProcessorId = options.rootProcessorId;
        if (!rootProcessorId) {
            throw new Error('Root processor ID is required for hierarchical root layout');
        }

        const rootProcessor = components.find((comp) => comp.id === rootProcessorId);
        if (!rootProcessor) {
            throw new Error('Root processor not found in components');
        }

        // Build connection graph
        const connectionMap = this.buildConnectionGraph(connections || []);

        // Calculate hierarchy levels from root
        // For bidirectional hierarchical layout, we include both incoming and outgoing connections
        const levels = this.calculateLevels(rootProcessorId, connectionMap, components);

        // Apply hierarchical layout
        return this.applyHierarchicalLayout(levels, components);
    }

    private buildConnectionGraph(connections: ComponentEntity[]): {
        outgoingConnections: Map<string, Set<string>>;
        incomingConnections: Map<string, Set<string>>;
    } {
        const outgoingConnections = new Map<string, Set<string>>();
        const incomingConnections = new Map<string, Set<string>>();

        console.log('Building connection graph from', connections.length, 'connections');

        connections.forEach((connection) => {
            const sourceId = connection.component.source.id;
            const destinationId = connection.component.destination.id;

            console.log(`Processing connection: ${sourceId} -> ${destinationId}`);

            // Build outgoing connections map (source -> destinations)
            if (!outgoingConnections.has(sourceId)) {
                outgoingConnections.set(sourceId, new Set());
            }
            outgoingConnections.get(sourceId)!.add(destinationId);

            // Build incoming connections map (destination -> sources)
            if (!incomingConnections.has(destinationId)) {
                incomingConnections.set(destinationId, new Set());
            }
            incomingConnections.get(destinationId)!.add(sourceId);
        });

        console.log('Outgoing connections map:', outgoingConnections);
        console.log('Incoming connections map:', incomingConnections);

        return { outgoingConnections, incomingConnections };
    }

    private calculateLevels(
        rootId: string,
        connectionMap: { outgoingConnections: Map<string, Set<string>>; incomingConnections: Map<string, Set<string>> },
        components: ComponentEntity[]
    ): Map<number, ComponentEntity[]> {
        const levels = new Map<number, ComponentEntity[]>();
        const visited = new Set<string>();
        const componentMap = new Map(components.map((comp) => [comp.id, comp]));

        console.log('Hierarchical Layout Debug - Root ID:', rootId);
        console.log('Outgoing connections map:', connectionMap.outgoingConnections);
        console.log('Incoming connections map:', connectionMap.incomingConnections);

        // Level 1: Root processor
        const rootComponent = componentMap.get(rootId);
        if (rootComponent) {
            levels.set(1, [rootComponent]);
            visited.add(rootId);
            console.log(`Added root ${rootId} at level 1`);
        }

        // Level 2: All processors directly connected to root (both incoming and outgoing)
        const level1Processors = new Set<string>();

        // Add processors that send TO root (incoming connections to root)
        const incomingToRoot = connectionMap.incomingConnections.get(rootId);
        if (incomingToRoot) {
            console.log(`Processors sending TO root ${rootId}:`, incomingToRoot);
            incomingToRoot.forEach((processorId) => {
                if (!visited.has(processorId)) {
                    level1Processors.add(processorId);
                }
            });
        }

        // Add processors that receive FROM root (outgoing connections from root)
        const outgoingFromRoot = connectionMap.outgoingConnections.get(rootId);
        if (outgoingFromRoot) {
            console.log(`Processors receiving FROM root ${rootId}:`, outgoingFromRoot);
            outgoingFromRoot.forEach((processorId) => {
                if (!visited.has(processorId)) {
                    level1Processors.add(processorId);
                }
            });
        }

        // Add level 2 processors
        if (level1Processors.size > 0) {
            const level1Components = Array.from(level1Processors)
                .map((id) => componentMap.get(id))
                .filter((comp): comp is ComponentEntity => comp !== undefined);
            levels.set(2, level1Components);
            level1Processors.forEach((id) => visited.add(id));
            console.log(`Added ${level1Components.length} processors at level 2:`, Array.from(level1Processors));
        }

        // Continue with BFS for remaining levels
        const queue: Array<{ id: string; level: number }> = [];
        level1Processors.forEach((id) => queue.push({ id, level: 2 }));

        while (queue.length > 0) {
            const { id, level } = queue.shift()!;

            // Add all processors that connect TO this processor to the next level
            const incomingProcessors = connectionMap.incomingConnections.get(id);
            if (incomingProcessors) {
                incomingProcessors.forEach((connectedId) => {
                    if (!visited.has(connectedId)) {
                        console.log(`Adding ${connectedId} to level ${level + 1} (incoming to ${id})`);
                        queue.push({ id: connectedId, level: level + 1 });
                        visited.add(connectedId);

                        const component = componentMap.get(connectedId);
                        if (component) {
                            if (!levels.has(level + 1)) {
                                levels.set(level + 1, []);
                            }
                            levels.get(level + 1)!.push(component);
                        }
                    }
                });
            }

            // Also add processors that this processor connects TO (outgoing connections)
            // This ensures we capture the full hierarchy in both directions
            const outgoingProcessors = connectionMap.outgoingConnections.get(id);
            if (outgoingProcessors) {
                outgoingProcessors.forEach((connectedId) => {
                    if (!visited.has(connectedId)) {
                        console.log(`Adding ${connectedId} to level ${level + 1} (outgoing from ${id})`);
                        queue.push({ id: connectedId, level: level + 1 });
                        visited.add(connectedId);

                        const component = componentMap.get(connectedId);
                        if (component) {
                            if (!levels.has(level + 1)) {
                                levels.set(level + 1, []);
                            }
                            levels.get(level + 1)!.push(component);
                        }
                    }
                });
            }
        }

        console.log('Final levels map:', levels);

        // Add any remaining components (not connected) to the last level
        const unvisited = components.filter((comp) => !visited.has(comp.id));
        if (unvisited.length > 0) {
            const maxLevel = Math.max(...levels.keys()) + 1;
            console.log(
                'Adding unvisited components to level',
                maxLevel,
                ':',
                unvisited.map((c) => c.id)
            );
            levels.set(maxLevel, unvisited);
        }

        return levels;
    }

    private applyHierarchicalLayout(
        levels: Map<number, ComponentEntity[]>,
        allComponents: ComponentEntity[]
    ): LayoutResult {
        const newPositions = new Map<string, Position>();

        const levelHeight = 280; // Enhanced vertical spacing between levels for better mirror layout
        const minComponentSpacing = 320; // Increased minimum horizontal spacing for perfect mirror arrangement
        const startY = 100;
        // Calculate center X based on the canvas or use a fixed center point
        const centerX = 520; // Center point for perfect symmetrical mirror arrangement

        // Get component dimensions with enhanced sizing for better layout
        // All components including funnels are properly sized for mirror arrangement
        const getComponentSize = (comp: ComponentEntity) => {
            switch (comp.component?.type) {
                case 'Processor':
                    return { width: 160, height: 60 };
                case 'ProcessGroup':
                    return { width: 240, height: 120 };
                case 'InputPort':
                    return { width: 100, height: 40 };
                case 'OutputPort':
                case 'OUTPUT_PORT':
                    return { width: 100, height: 40 };
                case 'Funnel':
                    return { width: 60, height: 60 }; // Funnels are circular, same width/height
                case 'RemoteProcessGroup':
                    return { width: 240, height: 100 };
                default:
                    return { width: 160, height: 60 };
            }
        };

        // Sort levels by level number
        const sortedLevels = Array.from(levels.entries()).sort(([a], [b]) => a - b);

        sortedLevels.forEach(([levelNum, levelComponents]) => {
            const y = startY + levelNum * levelHeight;

            // Sort components by type for better mirror arrangement
            // Group similar types together for more organized layout
            // Funnels are positioned strategically for optimal flow visualization
            const sortedComponents = levelComponents.sort((a, b) => {
                const typeOrder = {
                    InputPort: 0,
                    Funnel: 1, // Funnels positioned early for flow routing visibility
                    Processor: 2,
                    OutputPort: 3,
                    OUTPUT_PORT: 3,
                    ProcessGroup: 4,
                    RemoteProcessGroup: 5
                };

                const aType = a.component?.type || 'Processor';
                const bType = b.component?.type || 'Processor';

                return (
                    (typeOrder[aType as keyof typeof typeOrder] || 2) -
                    (typeOrder[bType as keyof typeof typeOrder] || 2)
                );
            });

            // Calculate dynamic spacing based on number of components and their sizes
            // Enhanced spacing calculation for better mirror layout including funnels
            const totalComponents = sortedComponents.length;
            const maxComponentWidth = Math.max(...sortedComponents.map((comp) => getComponentSize(comp).width));
            const baseSpacing = Math.max(minComponentSpacing, maxComponentWidth + 120); // Enhanced spacing

            // Additional spacing for components with different types to create clear separation
            // Special consideration for funnels to ensure they have adequate spacing
            const hasMultipleTypes = new Set(sortedComponents.map((comp) => comp.component?.type)).size > 1;
            const hasFunnels = sortedComponents.some((comp) => comp.component?.type === 'Funnel');
            const typeSpacing = hasMultipleTypes ? 50 : 0;
            const funnelSpacing = hasFunnels ? 30 : 0; // Extra spacing for funnel visibility

            const componentSpacing =
                totalComponents > 3
                    ? baseSpacing + (totalComponents - 3) * 40 + typeSpacing + funnelSpacing
                    : baseSpacing + typeSpacing + funnelSpacing;

            console.log(
                `Level ${levelNum}: ${totalComponents} components, spacing: ${componentSpacing}px, max width: ${maxComponentWidth}px, has funnels: ${hasFunnels}`
            );

            if (totalComponents === 1) {
                // Single component - place at center with perfect alignment
                const component = sortedComponents[0];
                const size = getComponentSize(component);
                const x = centerX - size.width / 2;
                const centeredY = y + (60 - size.height) / 2;
                newPositions.set(component.id, { x, y: centeredY });
                console.log(`Level ${levelNum}: Single component at center (${x}, ${centeredY})`);
            } else {
                // Multiple components - arrange with perfect symmetry where each component pair
                // is symmetric around their shared center point
                // Enhanced mirror arrangement ensuring components are symmetric with each other

                if (totalComponents % 2 === 1) {
                    // Odd number - place one at center, others in symmetric pairs
                    const centerIndex = Math.floor(totalComponents / 2);
                    const pairs = Math.floor(totalComponents / 2);

                    sortedComponents.forEach((component, index) => {
                        const size = getComponentSize(component);
                        let x: number;

                        if (index === centerIndex) {
                            // Center component - perfectly aligned with root processor
                            x = centerX - size.width / 2;
                        } else {
                            // Create symmetric pairs around the center
                            // Each pair is positioned so that they are symmetric around their midpoint
                            const pairIndex = index < centerIndex ? index : totalComponents - 1 - index;
                            const distanceFromCenter = (pairIndex + 1) * componentSpacing;

                            if (index < centerIndex) {
                                // Left side - position components with center-based symmetry
                                x = centerX - distanceFromCenter - size.width / 2;
                            } else {
                                // Right side - mirror position ensuring perfect symmetry with left pair
                                x = centerX + distanceFromCenter - size.width / 2;
                            }
                        }

                        const centeredY = y + (60 - size.height) / 2;
                        newPositions.set(component.id, { x, y: centeredY });
                        console.log(
                            `Level ${levelNum}, Component ${index} (${component.component?.type}): (${Math.round(x)}, ${Math.round(centeredY)}) - pair symmetry`
                        );
                    });
                } else {
                    // Even number - create perfect symmetric pairs
                    // Each pair of components is symmetric around their shared center point
                    const pairs = totalComponents / 2;

                    sortedComponents.forEach((component, index) => {
                        const size = getComponentSize(component);
                        let x: number;

                        // Calculate which pair this component belongs to
                        const pairIndex = Math.floor(index / 2);
                        const isLeftInPair = index % 2 === 0;

                        // Distance of this pair from the main center axis
                        const pairDistance = (pairIndex + 0.5) * componentSpacing;

                        if (isLeftInPair) {
                            // Left component of the pair
                            x = centerX - pairDistance - size.width / 2;
                        } else {
                            // Right component of the pair - perfect mirror of its pair partner
                            x = centerX + pairDistance - size.width / 2;
                        }

                        const centeredY = y + (60 - size.height) / 2;
                        newPositions.set(component.id, { x, y: centeredY });
                        console.log(
                            `Level ${levelNum}, Component ${index} (${component.component?.type}): (${Math.round(x)}, ${Math.round(centeredY)}) - pair ${pairIndex} ${isLeftInPair ? 'left' : 'right'}`
                        );
                    });
                }
            }
        });

        return { positions: newPositions };
    }
}
