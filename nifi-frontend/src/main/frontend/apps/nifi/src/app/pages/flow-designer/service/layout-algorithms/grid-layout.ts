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

export class GridLayoutAlgorithm implements LayoutAlgorithm {
    apply(components: ComponentEntity[], connections?: ComponentEntity[], options: LayoutOptions = {}): LayoutResult {
        const minSpacing = 80; // Minimum space between components
        const extraSpacing = 40; // Extra spacing for better visual separation
        const startX = 80;
        const startY = 80;

        // Calculate grid dimensions - prefer wider layouts for better readability
        const numComponents = components.length;
        const cols = Math.min(4, Math.ceil(Math.sqrt(numComponents * 1.5)));
        const rows = Math.ceil(numComponents / cols);

        // Get default component dimensions
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

        // Calculate column widths and row heights
        const colWidths = new Array(cols).fill(0);
        const rowHeights = new Array(rows).fill(0);

        components.forEach((comp, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const size = getComponentSize(comp);

            colWidths[col] = Math.max(colWidths[col], size.width);
            rowHeights[row] = Math.max(rowHeights[row], size.height);
        });

        const newPositions = new Map<string, Position>();

        components.forEach((comp, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const size = getComponentSize(comp);

            // Calculate X position with proper spacing
            let x = startX;
            for (let c = 0; c < col; c++) {
                x += colWidths[c] + minSpacing + extraSpacing;
            }
            x += (colWidths[col] - size.width) / 2; // Center in column

            // Calculate Y position with proper spacing
            let y = startY;
            for (let r = 0; r < row; r++) {
                y += rowHeights[r] + minSpacing + extraSpacing;
            }
            y += (rowHeights[row] - size.height) / 2; // Center in row

            newPositions.set(comp.id, { x, y });
        });

        return { positions: newPositions };
    }
}
