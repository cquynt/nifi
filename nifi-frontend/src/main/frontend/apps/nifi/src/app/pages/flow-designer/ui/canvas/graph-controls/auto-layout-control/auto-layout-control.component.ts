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

import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';

import { CanvasState } from '../../../../state';
import { LayoutType } from '../../../../service/auto-layout.service';
import { applyAutoLayout } from '../../../../state/flow/flow.actions';
// import { AutoLayoutConfigDialog } from './auto-layout-config-dialog/auto-layout-config-dialog.component';

@Component({
    selector: 'auto-layout-control',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatMenuModule, MatIconModule, MatDialogModule, MatDividerModule],
    template: `
        <div class="auto-layout-control">
            <button mat-icon-button class="primary-icon-button" [matMenuTriggerFor]="layoutMenu" title="Auto Layout">
                <i class="fa fa-magic"></i>
            </button>

            <mat-menu #layoutMenu="matMenu" class="auto-layout-menu">
                <button mat-menu-item (click)="applyLayout('hierarchical')">
                    <i class="fa fa-sitemap"></i>
                    <span>Hierarchical</span>
                </button>
                <button mat-menu-item (click)="applyLayout('force-directed')">
                    <i class="fa fa-arrows"></i>
                    <span>Force-Directed</span>
                </button>
                <button mat-menu-item (click)="applyLayout('grid')">
                    <i class="fa fa-th"></i>
                    <span>Grid</span>
                </button>
                <button mat-menu-item (click)="applyLayout('circular')">
                    <i class="fa fa-circle-o"></i>
                    <span>Circular</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="openConfigDialog()">
                    <i class="fa fa-cog"></i>
                    <span>Configure...</span>
                </button>
            </mat-menu>
        </div>
    `,
    styleUrls: ['./auto-layout-control.component.scss']
})
export class AutoLayoutControl {
    constructor(
        private store: Store<CanvasState>,
        private dialog: MatDialog
    ) {}

    applyLayout(layoutType: string): void {
        this.store.dispatch(
            applyAutoLayout({
                request: {
                    layoutType: layoutType as LayoutType,
                    components: [], // Will be populated in effects
                    options: this.getDefaultOptions(layoutType as LayoutType)
                }
            })
        );
    }

    openConfigDialog(): void {
        // TODO: Implement configuration dialog
        console.log('Configuration dialog - to be implemented');
        // const dialogRef = this.dialog.open(AutoLayoutConfigDialog, {
        //     width: '400px',
        //     disableClose: false
        // });

        // dialogRef.afterClosed().subscribe((result) => {
        //     if (result) {
        //         this.store.dispatch(
        //             applyAutoLayout({
        //                 request: {
        //                     layoutType: result.layoutType,
        //                     components: [],
        //                     options: result.options
        //                 }
        //             })
        //         );
        //     }
        // });
    }

    private getDefaultOptions(layoutType: LayoutType): any {
        switch (layoutType) {
            case LayoutType.HIERARCHICAL:
                return {
                    direction: 'TB',
                    nodeSpacing: 80,
                    rankSeparation: 120
                };
            case LayoutType.FORCE_DIRECTED:
                return {
                    iterations: 300
                };
            case LayoutType.GRID:
                return {
                    nodeSpacing: 150
                };
            case LayoutType.CIRCULAR:
                return {};
            default:
                return {};
        }
    }
}
