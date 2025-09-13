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

export interface LayoutAlgorithm {
    apply(components: ComponentEntity[], connections?: ComponentEntity[], options?: any): LayoutResult;
}

export interface LayoutResult {
    positions: Map<string, Position>;
    connections?: Map<string, Position[]>;
}

export interface LayoutOptions {
    nodeSpacing?: number;
    rankSeparation?: number;
    direction?: 'TB' | 'BT' | 'LR' | 'RL';
    iterations?: number;
    preserveAspectRatio?: boolean;
    rootProcessorId?: string;
    radius?: number;
}

export interface Node {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    data?: any;
}

export interface Edge {
    source: string;
    target: string;
    data?: any;
}
