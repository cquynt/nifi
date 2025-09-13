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

import { Injectable } from '@angular/core';
import { ComponentEntity } from '../state/flow';
import { Position } from '../state/shared';
import { LayoutResult } from './layout-algorithms/layout-types';
import { HierarchicalLayoutAlgorithm } from './layout-algorithms/hierarchical-layout';
import { ForceDirectedLayoutAlgorithm } from './layout-algorithms/force-directed-layout';
import { GridLayoutAlgorithm } from './layout-algorithms/grid-layout';
import { CircularLayoutAlgorithm } from './layout-algorithms/circular-layout';
import { HierarchicalRootLayoutAlgorithm } from './layout-algorithms/hierarchical-root-layout';

export interface LayoutOptions {
    nodeSpacing?: number;
    rankSeparation?: number;
    direction?: 'TB' | 'BT' | 'LR' | 'RL';
    iterations?: number;
    preserveAspectRatio?: boolean;
    rootProcessorId?: string;
}

export enum LayoutType {
    HIERARCHICAL = 'hierarchical',
    FORCE_DIRECTED = 'force-directed',
    GRID = 'grid',
    CIRCULAR = 'circular',
    HIERARCHICAL_ROOT = 'hierarchical-root'
}

@Injectable({
    providedIn: 'root'
})
export class AutoLayoutService {
    applyLayout(
        layoutType: LayoutType,
        components: ComponentEntity[],
        connections: ComponentEntity[],
        options?: LayoutOptions
    ): LayoutResult {
        console.log('AutoLayoutService.applyLayout called:', {
            layoutType,
            componentsCount: components.length,
            connectionsCount: connections.length,
            options
        });

        // Get actual component dimensions from DOM
        const componentDimensions = this.getComponentDimensions(components);
        const positions = new Map<string, Position>();

        switch (layoutType) {
            case 'grid':
                return this.applyGridLayoutWithDimensions(components, componentDimensions, options);
            case 'circular':
                return this.applyCircularLayoutWithDimensions(components, componentDimensions, options);
            case 'hierarchical':
                return this.applyHierarchicalLayout(components, connections, options);
            case 'force-directed':
                return this.applyForceDirectedLayout(components, connections, options);
            case 'hierarchical-root':
                return this.applyHierarchicalRootLayout(components, connections, options);
            default:
                return this.applyGridLayoutWithDimensions(components, componentDimensions, options);
        }
    }

    private applyHierarchicalLayout(
        components: ComponentEntity[],
        connections: ComponentEntity[],
        options?: LayoutOptions
    ): LayoutResult {
        // Implementation in separate algorithm class
        const algorithm = new HierarchicalLayoutAlgorithm();
        return algorithm.apply(components, connections, options);
    }

    private applyHierarchicalRootLayout(
        components: ComponentEntity[],
        connections: ComponentEntity[],
        options?: LayoutOptions
    ): LayoutResult {
        const algorithm = new HierarchicalRootLayoutAlgorithm();
        return algorithm.apply(components, connections, options);
    }

    private applyForceDirectedLayout(
        components: ComponentEntity[],
        connections: ComponentEntity[],
        options?: LayoutOptions
    ): LayoutResult {
        const algorithm = new ForceDirectedLayoutAlgorithm();
        return algorithm.apply(components, connections, options);
    }

    private applyGridLayout(components: ComponentEntity[], options?: LayoutOptions): LayoutResult {
        const algorithm = new GridLayoutAlgorithm();
        return algorithm.apply(components, undefined, options);
    }

    private applyCircularLayout(components: ComponentEntity[], options?: LayoutOptions): LayoutResult {
        const algorithm = new CircularLayoutAlgorithm();
        return algorithm.apply(components, undefined, options);
    }

    private getComponentDimensions(components: ComponentEntity[]): Map<string, { width: number; height: number }> {
        const dimensions = new Map<string, { width: number; height: number }>();

        components.forEach((component) => {
            // Try to find the actual DOM element for this component using various selectors
            const selectors = [
                `[data-testid="component-${component.id}"]`,
                `#component-${component.id}`,
                `g[id="${component.id}"]`,
                `.component[data-id="${component.id}"]`,
                `g.component:has([data-id="${component.id}"])`,
                `.processor[data-id="${component.id}"]`,
                `.process-group[data-id="${component.id}"]`,
                `.funnel[data-id="${component.id}"]`,
                `.input-port[data-id="${component.id}"]`,
                `.output-port[data-id="${component.id}"]`
            ];

            let element = null;
            for (const selector of selectors) {
                try {
                    element = document.querySelector(selector);
                    if (element) break;
                } catch (e) {
                    // Skip invalid selectors
                }
            }

            if (element) {
                const rect = element.getBoundingClientRect();
                const width = Math.max(rect.width || 0, 80); // Minimum width
                const height = Math.max(rect.height || 0, 30); // Minimum height

                dimensions.set(component.id, { width, height });
                console.log(`Found actual dimensions for ${component.id}: ${width} x ${height}`);
            } else {
                // Use enhanced default dimensions based on component type
                const defaultDimensions = this.getDefaultComponentDimensions(component);
                dimensions.set(component.id, defaultDimensions);
                console.log(
                    `Using default dimensions for ${component.id}: ${defaultDimensions.width} x ${defaultDimensions.height}`
                );
            }
        });

        return dimensions;
    }

    private getDefaultComponentDimensions(component: ComponentEntity): { width: number; height: number } {
        // Return realistic default sizes based on component type to prevent overlapping
        switch (component.component?.type) {
            case 'Processor':
                return { width: 160, height: 60 }; // Larger for better visibility
            case 'InputPort':
            case 'OUTPUT_PORT':
                return { width: 100, height: 40 };
            case 'ProcessGroup':
                return { width: 240, height: 120 }; // Much larger for process groups
            case 'Funnel':
                return { width: 60, height: 60 }; // Square funnel
            case 'Label':
                return { width: 140, height: 30 };
            default:
                return { width: 160, height: 60 }; // Default to processor size
        }
    }

    private applyGridLayoutWithDimensions(
        components: ComponentEntity[],
        dimensions: Map<string, { width: number; height: number }>,
        options?: LayoutOptions
    ): LayoutResult {
        const positions = new Map<string, Position>();
        const minPadding = 40; // Minimum space between components
        const extraPadding = 20; // Extra padding for visual comfort

        // Calculate optimal grid size - prefer wider grids for better layout
        const cols = Math.min(4, Math.ceil(Math.sqrt(components.length * 1.5)));
        const rows = Math.ceil(components.length / cols);

        // Pre-calculate dimensions for all components
        const componentDims = components.map((comp) => ({
            id: comp.id,
            ...(dimensions.get(comp.id) || { width: 160, height: 60 })
        }));

        // Calculate required width for each column and height for each row
        const colWidths = new Array(cols).fill(0);
        const rowHeights = new Array(rows).fill(0);

        components.forEach((comp, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const dim = dimensions.get(comp.id) || { width: 160, height: 60 };

            colWidths[col] = Math.max(colWidths[col], dim.width);
            rowHeights[row] = Math.max(rowHeights[row], dim.height);
        });

        // Calculate positions with proper spacing
        let startX = 80; // Left margin
        let startY = 80; // Top margin

        components.forEach((comp, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const dim = dimensions.get(comp.id) || { width: 160, height: 60 };

            // Calculate X position: sum of all previous column widths + padding
            let x = startX;
            for (let c = 0; c < col; c++) {
                x += colWidths[c] + minPadding + extraPadding;
            }
            // Center component in its column
            x += (colWidths[col] - dim.width) / 2;

            // Calculate Y position: sum of all previous row heights + padding
            let y = startY;
            for (let r = 0; r < row; r++) {
                y += rowHeights[r] + minPadding + extraPadding;
            }
            // Center component in its row
            y += (rowHeights[row] - dim.height) / 2;

            positions.set(comp.id, { x, y });
            console.log(
                `Grid position for ${comp.id}: (${x}, ${y}) [${dim.width}x${dim.height}] in col ${col}, row ${row}`
            );
        });

        return {
            positions
        };
    }

    private applyCircularLayoutWithDimensions(
        components: ComponentEntity[],
        dimensions: Map<string, { width: number; height: number }>,
        options?: LayoutOptions
    ): LayoutResult {
        const positions = new Map<string, Position>();
        const centerX = 400;
        const centerY = 300;

        // Calculate optimal radius to prevent overlapping
        const maxDimension = Math.max(...Array.from(dimensions.values()).map((d) => Math.max(d.width, d.height)));
        const avgDimension =
            Array.from(dimensions.values()).reduce((sum, d) => sum + Math.max(d.width, d.height), 0) / dimensions.size;

        // Calculate radius based on component count and sizes
        const circumference = components.length * (avgDimension + 60); // 60px spacing between components
        const minRadius = circumference / (2 * Math.PI);
        const radius = Math.max(minRadius, 200); // Minimum radius for visual appeal

        console.log(
            `Circular layout: ${components.length} components, avgDimension: ${avgDimension}, radius: ${radius}`
        );

        components.forEach((comp, index) => {
            const angle = (2 * Math.PI * index) / components.length;
            const dim = dimensions.get(comp.id) || { width: 160, height: 60 };

            // Calculate position and center the component on the circle
            const x = centerX + radius * Math.cos(angle) - dim.width / 2;
            const y = centerY + radius * Math.sin(angle) - dim.height / 2;

            positions.set(comp.id, { x, y });
            console.log(
                `Circular position for ${comp.id}: (${x}, ${y}) [${dim.width}x${dim.height}] at angle ${((angle * 180) / Math.PI).toFixed(1)}°`
            );
        });

        return {
            positions
        };
    }
}
