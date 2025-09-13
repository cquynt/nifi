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

import * as dagre from 'dagre';
import { LayoutAlgorithm, LayoutResult } from './layout-types';
import { ComponentEntity } from '../../state/flow';
import { Position } from '../../state/shared';
import { LayoutOptions } from '../auto-layout.service';

export class HierarchicalLayoutAlgorithm implements LayoutAlgorithm {
    apply(
        components: ComponentEntity[],
        connections: ComponentEntity[] = [],
        options: LayoutOptions = {}
    ): LayoutResult {
        const g = new dagre.graphlib.Graph();

        // Set graph options
        g.setGraph({
            rankdir: options.direction || 'TB',
            nodesep: options.nodeSpacing || 80,
            ranksep: options.rankSeparation || 120,
            marginx: 20,
            marginy: 20
        });

        g.setDefaultEdgeLabel(() => ({}));

        // Add nodes
        components.forEach((comp) => {
            const width = comp.component.dimensions?.width || 100;
            const height = comp.component.dimensions?.height || 50;

            g.setNode(comp.id, {
                width,
                height,
                label: comp.component.name || comp.id
            });
        });

        // Add edges based on connections
        connections.forEach((conn) => {
            if (conn.component.source && conn.component.destination) {
                g.setEdge(conn.component.source.id, conn.component.destination.id);
            }
        });

        // Apply layout
        dagre.layout(g);

        // Extract new positions
        const newPositions = new Map<string, Position>();
        components.forEach((comp) => {
            const node = g.node(comp.id);
            if (node) {
                newPositions.set(comp.id, {
                    x: Math.round(node.x - node.width / 2),
                    y: Math.round(node.y - node.height / 2)
                });
            }
        });

        return { positions: newPositions };
    }
}
