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

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';

import { LayoutType } from '../../../../../service/auto-layout.service';

@Component({
    selector: 'auto-layout-config-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule
    ],
    template: `
        <div class="auto-layout-config-dialog">
            <h2 mat-dialog-title>Auto Layout Configuration</h2>

            <mat-dialog-content>
                <form [formGroup]="configForm" class="config-form">
                    <mat-form-field appearance="outline">
                        <mat-label>Layout Type</mat-label>
                        <mat-select formControlName="layoutType" (selectionChange)="onLayoutTypeChange()">
                            <mat-option value="hierarchical">Hierarchical</mat-option>
                            <mat-option value="force-directed">Force-Directed</mat-option>
                            <mat-option value="grid">Grid</mat-option>
                            <mat-option value="circular">Circular</mat-option>
                        </mat-select>
                    </mat-form-field>

                    <!-- Hierarchical Layout Options -->
                    <div *ngIf="selectedLayoutType === 'hierarchical'" class="layout-options">
                        <mat-form-field appearance="outline">
                            <mat-label>Direction</mat-label>
                            <mat-select formControlName="direction">
                                <mat-option value="TB">Top to Bottom</mat-option>
                                <mat-option value="BT">Bottom to Top</mat-option>
                                <mat-option value="LR">Left to Right</mat-option>
                                <mat-option value="RL">Right to Left</mat-option>
                            </mat-select>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                            <mat-label>Node Spacing</mat-label>
                            <input matInput type="number" formControlName="nodeSpacing" min="50" max="200" />
                            <mat-hint>Distance between nodes in the same rank</mat-hint>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                            <mat-label>Rank Separation</mat-label>
                            <input matInput type="number" formControlName="rankSeparation" min="80" max="300" />
                            <mat-hint>Distance between different ranks</mat-hint>
                        </mat-form-field>
                    </div>

                    <!-- Force-Directed Layout Options -->
                    <div *ngIf="selectedLayoutType === 'force-directed'" class="layout-options">
                        <mat-form-field appearance="outline">
                            <mat-label>Iterations</mat-label>
                            <input matInput type="number" formControlName="iterations" min="100" max="1000" />
                            <mat-hint>Number of simulation iterations</mat-hint>
                        </mat-form-field>
                    </div>

                    <!-- Grid Layout Options -->
                    <div *ngIf="selectedLayoutType === 'grid'" class="layout-options">
                        <mat-form-field appearance="outline">
                            <mat-label>Node Spacing</mat-label>
                            <input matInput type="number" formControlName="gridSpacing" min="100" max="300" />
                            <mat-hint>Distance between grid cells</mat-hint>
                        </mat-form-field>
                    </div>

                    <!-- Circular Layout Options -->
                    <div *ngIf="selectedLayoutType === 'circular'" class="layout-options">
                        <mat-form-field appearance="outline">
                            <mat-label>Radius</mat-label>
                            <input matInput type="number" formControlName="radius" min="100" max="500" />
                            <mat-hint>Radius of the circle (auto if empty)</mat-hint>
                        </mat-form-field>
                    </div>
                </form>
            </mat-dialog-content>

            <mat-dialog-actions align="end">
                <button mat-button (click)="cancel()">Cancel</button>
                <button mat-raised-button color="primary" (click)="apply()" [disabled]="!configForm.valid">
                    Apply Layout
                </button>
            </mat-dialog-actions>
        </div>
    `,
    styleUrls: ['./auto-layout-config-dialog.component.scss']
})
export class AutoLayoutConfigDialog implements OnInit {
    configForm: FormGroup;
    selectedLayoutType: string = 'hierarchical';

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<AutoLayoutConfigDialog>
    ) {
        this.configForm = this.fb.group({
            layoutType: ['hierarchical', Validators.required],

            // Hierarchical options
            direction: ['TB'],
            nodeSpacing: [80, [Validators.min(50), Validators.max(200)]],
            rankSeparation: [120, [Validators.min(80), Validators.max(300)]],

            // Force-directed options
            iterations: [300, [Validators.min(100), Validators.max(1000)]],

            // Grid options
            gridSpacing: [150, [Validators.min(100), Validators.max(300)]],

            // Circular options
            radius: [null, [Validators.min(100), Validators.max(500)]]
        });
    }

    ngOnInit(): void {
        this.onLayoutTypeChange();
    }

    onLayoutTypeChange(): void {
        this.selectedLayoutType = this.configForm.get('layoutType')?.value;
    }

    apply(): void {
        if (this.configForm.valid) {
            const formValue = this.configForm.value;
            const layoutType = formValue.layoutType as LayoutType;

            let options: any = {};

            switch (layoutType) {
                case LayoutType.HIERARCHICAL:
                    options = {
                        direction: formValue.direction,
                        nodeSpacing: formValue.nodeSpacing,
                        rankSeparation: formValue.rankSeparation
                    };
                    break;
                case LayoutType.FORCE_DIRECTED:
                    options = {
                        iterations: formValue.iterations
                    };
                    break;
                case LayoutType.GRID:
                    options = {
                        nodeSpacing: formValue.gridSpacing
                    };
                    break;
                case LayoutType.CIRCULAR:
                    options = {
                        radius: formValue.radius
                    };
                    break;
            }

            this.dialogRef.close({
                layoutType,
                options
            });
        }
    }

    cancel(): void {
        this.dialogRef.close();
    }
}
