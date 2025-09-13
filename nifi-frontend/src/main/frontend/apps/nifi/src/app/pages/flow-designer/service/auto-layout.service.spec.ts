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

import { TestBed } from '@angular/core/testing';
import { AutoLayoutService, LayoutType } from './auto-layout.service';

describe('AutoLayoutService', () => {
    let service: AutoLayoutService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AutoLayoutService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should apply grid layout', () => {
        const mockComponents = [
            {
                id: 'comp1',
                position: { x: 0, y: 0 },
                revision: { version: 1 },
                permissions: { canRead: true, canWrite: true },
                component: {}
            },
            {
                id: 'comp2',
                position: { x: 100, y: 100 },
                revision: { version: 1 },
                permissions: { canRead: true, canWrite: true },
                component: {}
            }
        ];

        const result = service.applyLayout(LayoutType.GRID, mockComponents, []);

        expect(result.positions).toBeDefined();
        expect(result.positions.size).toBe(2);
        expect(result.positions.get('comp1')).toEqual({ x: 50, y: 50 });
        expect(result.positions.get('comp2')).toEqual({ x: 200, y: 50 });
    });

    it('should apply circular layout', () => {
        const mockComponents = [
            {
                id: 'comp1',
                position: { x: 0, y: 0 },
                revision: { version: 1 },
                permissions: { canRead: true, canWrite: true },
                component: {}
            },
            {
                id: 'comp2',
                position: { x: 100, y: 100 },
                revision: { version: 1 },
                permissions: { canRead: true, canWrite: true },
                component: {}
            }
        ];

        const result = service.applyLayout(LayoutType.CIRCULAR, mockComponents, []);

        expect(result.positions).toBeDefined();
        expect(result.positions.size).toBe(2);

        // Check that components are positioned in a circle
        const pos1 = result.positions.get('comp1');
        const pos2 = result.positions.get('comp2');
        expect(pos1).toBeDefined();
        expect(pos2).toBeDefined();
    });
});
