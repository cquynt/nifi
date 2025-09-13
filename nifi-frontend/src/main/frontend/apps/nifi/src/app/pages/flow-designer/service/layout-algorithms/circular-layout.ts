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

import { LayoutAlgorithm, LayoutResult } from './layout-types';
import { ComponentEntity } from '../../state/flow';
import { Position } from '../../state/shared';
import { LayoutOptions } from '../auto-layout.service';

export class CircularLayoutAlgorithm implements LayoutAlgorithm {
    apply(components: ComponentEntity[], connections?: ComponentEntity[], options: LayoutOptions = {}): LayoutResult {
        const centerX = 600;
        const centerY = 400;

        // Calculate radius based on component count and sizes
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

        // Calculate minimum radius to prevent overlapping
        const numComponents = components.length;
        if (numComponents === 0) {
            return { positions: new Map() };
        }

        // Find largest component dimension
        const maxComponentDimension = Math.max(
            ...components.map((comp) => {
                const size = getComponentSize(comp);
                return Math.max(size.width, size.height);
            })
        );

        // Calculate minimum radius based on component sizes and spacing
        const minComponentSpacing = 60; // Minimum space between components
        const angleStep = (2 * Math.PI) / numComponents;

        // Calculate required radius to maintain spacing
        const minRadiusForSpacing = (maxComponentDimension + minComponentSpacing) / (2 * Math.sin(angleStep / 2));
        const radius = Math.max(200, minRadiusForSpacing + 50); // At least 200px radius

        const newPositions = new Map<string, Position>();

        components.forEach((comp, index) => {
            const angle = (index * 2 * Math.PI) / numComponents;
            const size = getComponentSize(comp);

            // Calculate position on circle
            const x = centerX + radius * Math.cos(angle) - size.width / 2;
            const y = centerY + radius * Math.sin(angle) - size.height / 2;

            newPositions.set(comp.id, { x, y });
        });

        return { positions: newPositions };
    }
}
