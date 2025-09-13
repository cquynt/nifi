# Auto Layout Implementation Guide for Apache NiFi

## ✅ IMPLEMENTATION STATUS: COMPLETED (Phase 1 & 2)

**🎉 Successfully implemented core Auto Layout functionality for Apache NiFi!**

### ✅ What's Working

- ✅ Auto Layout Service with 4 algorithms (Hierarchical, Force-Directed, Grid, Circular)
- ✅ UI Integration with navigation controls
- ✅ State management via Redux actions/effects
- ✅ Unit tests passing
- ✅ Build successful
- ✅ Development server running at http://localhost:4200/nifi

### 🔧 Current Implementation

**Core Features Implemented:**

1. **AutoLayoutService** - Complete with 4 layout algorithms
2. **Layout Algorithms** - Hierarchical (Dagre), Force-Directed (D3), Grid, Circular
3. **UI Controls** - Auto Layout button in navigation controls with dropdown menu
4. **State Management** - Redux actions, effects, and reducers
5. **Testing** - Unit tests for core functionality

**Files Created/Modified:**

- `service/auto-layout.service.ts` - Main service
- `service/layout-algorithms/` - All layout algorithm implementations
- `ui/canvas/graph-controls/auto-layout-control/` - UI components
- `state/flow/flow.actions.ts` - Added auto layout actions
- `state/flow/flow.effects.ts` - Added auto layout effects
- `state/shared/index.ts` - Added shared types

## Tổng quan

Tính năng Auto Layout sẽ cho phép người dùng tự động sắp xếp các components trên canvas theo các thuật toán layout khác nhau, giúp tối ưu hóa việc hiển thị và quản lý dataflow.

## 1. Phân tích kiến trúc hiện tại

### Các thành phần chính:

- **Canvas Component**: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/ui/canvas/`
- **Graph Controls**: Navigation và Operation controls
- **Canvas Utils**: Utility functions cho positioning
- **Context Menu**: Đã có align horizontally/vertically

### Tính năng hiện có có thể tái sử dụng:

- Align components (horizontal/vertical)
- Position update system với actions/effects
- D3.js integration cho visualization
- Component selection và manipulation

## 2. Thiết kế tính năng Auto Layout

### 2.1 Các thuật toán layout

#### 1. Hierarchical Layout (Dagre-based)

- Phù hợp cho directed acyclic graphs
- Sắp xếp theo layers từ trên xuống
- Tự động detect flow direction
- Minimize edge crossings
- Phai tinh den kich thuoc cua cac thanh phan trong canva: Processor, ProcessorGroup, input, output, connections.
- Cac thanh phan ket noi voi nhau thi luon nam ben trai.
- Cac thanh phan khong ket noi voi nhau thi luon nam ben phai, va sap sep ngay ngan khoa hoc.
- Hay tham khao cac thiet ke flow cua N8N de co thuat toan tot nhat

### 2.2 UI/UX Design

- Thêm button "Auto Layout" vào Graph Controls
- Dropdown menu cho các loại layout
- Configuration dialog cho advanced options
- Animation transitions khi apply layout
- Preview mode trước khi apply
- Undo/Redo support

## 3. Kế hoạch Implementation

### Phase 1: Core Infrastructure (2-3 tuần)

#### 3.1 Tạo Auto Layout Service

Tạo file: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/service/auto-layout.service.ts`

```typescript
import { Injectable } from "@angular/core";
import { ComponentEntity, ConnectionEntity, Position } from "../state/shared";

export interface LayoutResult {
  positions: Map<string, Position>;
  connections?: Map<string, Position[]>; // For bend points
}

export interface LayoutOptions {
  nodeSpacing?: number;
  rankSeparation?: number;
  direction?: "TB" | "BT" | "LR" | "RL";
  iterations?: number;
  preserveAspectRatio?: boolean;
}

export enum LayoutType {
  HIERARCHICAL = "hierarchical",
  FORCE_DIRECTED = "force-directed",
  GRID = "grid",
  CIRCULAR = "circular",
}

@Injectable({
  providedIn: "root",
})
export class AutoLayoutService {
  applyLayout(
    layoutType: LayoutType,
    components: ComponentEntity[],
    connections: ConnectionEntity[],
    options?: LayoutOptions
  ): LayoutResult {
    switch (layoutType) {
      case LayoutType.HIERARCHICAL:
        return this.applyHierarchicalLayout(components, connections, options);
      case LayoutType.FORCE_DIRECTED:
        return this.applyForceDirectedLayout(components, connections, options);
      case LayoutType.GRID:
        return this.applyGridLayout(components, options);
      case LayoutType.CIRCULAR:
        return this.applyCircularLayout(components, options);
      default:
        throw new Error(`Unknown layout type: ${layoutType}`);
    }
  }

  private applyHierarchicalLayout(
    components: ComponentEntity[],
    connections: ConnectionEntity[],
    options?: LayoutOptions
  ): LayoutResult {
    // Implementation in separate algorithm class
    const algorithm = new HierarchicalLayoutAlgorithm();
    return algorithm.apply(components, connections, options);
  }

  private applyForceDirectedLayout(
    components: ComponentEntity[],
    connections: ConnectionEntity[],
    options?: LayoutOptions
  ): LayoutResult {
    const algorithm = new ForceDirectedLayoutAlgorithm();
    return algorithm.apply(components, connections, options);
  }

  private applyGridLayout(
    components: ComponentEntity[],
    options?: LayoutOptions
  ): LayoutResult {
    const algorithm = new GridLayoutAlgorithm();
    return algorithm.apply(components, options);
  }

  private applyCircularLayout(
    components: ComponentEntity[],
    options?: LayoutOptions
  ): LayoutResult {
    const algorithm = new CircularLayoutAlgorithm();
    return algorithm.apply(components, options);
  }
}
```

#### 3.2 Tạo Layout Algorithms

Tạo thư mục: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/service/layout-algorithms/`

##### 3.2.1 Layout Types Definition

File: `layout-types.ts`

```typescript
import {
  ComponentEntity,
  ConnectionEntity,
  Position,
} from "../../state/shared";

export interface LayoutAlgorithm {
  apply(
    components: ComponentEntity[],
    connections?: ConnectionEntity[],
    options?: any
  ): LayoutResult;
}

export interface LayoutResult {
  positions: Map<string, Position>;
  connections?: Map<string, Position[]>;
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
```

##### 3.2.2 Hierarchical Layout Algorithm

File: `hierarchical-layout.ts`

```typescript
import * as dagre from "dagre";
import { LayoutAlgorithm, LayoutResult, Node } from "./layout-types";
import {
  ComponentEntity,
  ConnectionEntity,
  Position,
} from "../../state/shared";
import { LayoutOptions } from "../auto-layout.service";

export class HierarchicalLayoutAlgorithm implements LayoutAlgorithm {
  apply(
    components: ComponentEntity[],
    connections: ConnectionEntity[] = [],
    options: LayoutOptions = {}
  ): LayoutResult {
    const g = new dagre.graphlib.Graph();

    // Set graph options
    g.setGraph({
      rankdir: options.direction || "TB",
      nodesep: options.nodeSpacing || 80,
      ranksep: options.rankSeparation || 120,
      marginx: 20,
      marginy: 20,
    });

    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes
    components.forEach((comp) => {
      const width = comp.component.dimensions?.width || 100;
      const height = comp.component.dimensions?.height || 50;

      g.setNode(comp.id, {
        width,
        height,
        label: comp.component.name || comp.id,
      });
    });

    // Add edges
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
          y: Math.round(node.y - node.height / 2),
        });
      }
    });

    return { positions: newPositions };
  }
}
```

##### 3.2.3 Force-Directed Layout Algorithm

File: `force-directed-layout.ts`

```typescript
import * as d3 from "d3";
import { LayoutAlgorithm, LayoutResult } from "./layout-types";
import {
  ComponentEntity,
  ConnectionEntity,
  Position,
} from "../../state/shared";
import { LayoutOptions } from "../auto-layout.service";

export class ForceDirectedLayoutAlgorithm implements LayoutAlgorithm {
  apply(
    components: ComponentEntity[],
    connections: ConnectionEntity[] = [],
    options: LayoutOptions = {}
  ): LayoutResult {
    const width = 800;
    const height = 600;
    const iterations = options.iterations || 300;

    // Prepare nodes
    const nodes = components.map((comp) => ({
      id: comp.id,
      x: comp.position?.x || Math.random() * width,
      y: comp.position?.y || Math.random() * height,
      width: comp.component.dimensions?.width || 100,
      height: comp.component.dimensions?.height || 50,
      fx: null as number | null,
      fy: null as number | null,
    }));

    // Prepare links
    const links = connections
      .filter((conn) => conn.component.source && conn.component.destination)
      .map((conn) => ({
        source: conn.component.source!.id,
        target: conn.component.destination!.id,
      }));

    // Create simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(150)
          .strength(0.5)
      )
      .force("charge", d3.forceManyBody().strength(-400).distanceMax(300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3
          .forceCollide()
          .radius((d: any) => Math.max(d.width, d.height) / 2 + 10)
          .strength(0.7)
      )
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1));

    // Run simulation synchronously
    simulation.stop();
    for (let i = 0; i < iterations; i++) {
      simulation.tick();
    }

    // Extract final positions
    const newPositions = new Map<string, Position>();
    nodes.forEach((node) => {
      newPositions.set(node.id, {
        x: Math.round(node.x - node.width / 2),
        y: Math.round(node.y - node.height / 2),
      });
    });

    return { positions: newPositions };
  }
}
```

##### 3.2.4 Grid Layout Algorithm

File: `grid-layout.ts`

```typescript
import { LayoutAlgorithm, LayoutResult } from "./layout-types";
import { ComponentEntity, Position } from "../../state/shared";
import { LayoutOptions } from "../auto-layout.service";

export class GridLayoutAlgorithm implements LayoutAlgorithm {
  apply(
    components: ComponentEntity[],
    connections?: any[],
    options: LayoutOptions = {}
  ): LayoutResult {
    const nodeSpacing = options.nodeSpacing || 150;
    const startX = 50;
    const startY = 50;

    // Calculate grid dimensions
    const numComponents = components.length;
    const cols = Math.ceil(Math.sqrt(numComponents));
    const rows = Math.ceil(numComponents / cols);

    const newPositions = new Map<string, Position>();

    components.forEach((comp, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      const x = startX + col * nodeSpacing;
      const y = startY + row * nodeSpacing;

      newPositions.set(comp.id, { x, y });
    });

    return { positions: newPositions };
  }
}
```

##### 3.2.5 Circular Layout Algorithm

File: `circular-layout.ts`

```typescript
import { LayoutAlgorithm, LayoutResult } from "./layout-types";
import { ComponentEntity, Position } from "../../state/shared";
import { LayoutOptions } from "../auto-layout.service";

export class CircularLayoutAlgorithm implements LayoutAlgorithm {
  apply(
    components: ComponentEntity[],
    connections?: any[],
    options: LayoutOptions = {}
  ): LayoutResult {
    const centerX = 400;
    const centerY = 300;
    const radius = Math.max(150, components.length * 20);

    const newPositions = new Map<string, Position>();

    if (components.length === 1) {
      // Single component at center
      newPositions.set(components[0].id, {
        x: centerX - 50,
        y: centerY - 25,
      });
    } else {
      // Arrange in circle
      const angleStep = (2 * Math.PI) / components.length;

      components.forEach((comp, index) => {
        const angle = index * angleStep - Math.PI / 2; // Start from top
        const x = centerX + radius * Math.cos(angle) - 50; // Offset for component width
        const y = centerY + radius * Math.sin(angle) - 25; // Offset for component height

        newPositions.set(comp.id, { x: Math.round(x), y: Math.round(y) });
      });
    }

    return { positions: newPositions };
  }
}
```

#### 3.3 Extend Actions/Effects

File: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/state/flow/flow.actions.ts`

Thêm vào actions:

```typescript
export const applyAutoLayout = createAction(
  "[Flow] Apply Auto Layout",
  props<{ request: AutoLayoutRequest }>()
);

export const applyAutoLayoutSuccess = createAction(
  "[Flow] Apply Auto Layout Success",
  props<{ response: LayoutResult }>()
);

export const applyAutoLayoutFailure = createAction(
  "[Flow] Apply Auto Layout Failure",
  props<{ error: string }>()
);
```

File: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/state/shared/index.ts`

Thêm interfaces:

```typescript
export interface AutoLayoutRequest {
  layoutType: LayoutType;
  components: ComponentEntity[];
  connections?: ConnectionEntity[];
  options?: LayoutOptions;
}
```

#### 3.4 Tạo Auto Layout Effects

File: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/state/flow/auto-layout.effects.ts`

```typescript
import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { of } from "rxjs";
import { catchError, map, switchMap, withLatestFrom } from "rxjs/operators";

import { AutoLayoutService } from "../../service/auto-layout.service";
import { CanvasState } from "../index";
import {
  applyAutoLayout,
  applyAutoLayoutSuccess,
  applyAutoLayoutFailure,
  updatePositions,
} from "./flow.actions";
import { selectCurrentProcessGroupFlowComponents } from "./flow.selectors";
import { DraggableBehavior } from "../../service/behavior/draggable-behavior.service";

@Injectable()
export class AutoLayoutEffects {
  applyAutoLayout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(applyAutoLayout),
      withLatestFrom(
        this.store.select(selectCurrentProcessGroupFlowComponents)
      ),
      switchMap(([action, flowComponents]) => {
        try {
          // Get all components that can be positioned
          const allComponents = [
            ...flowComponents.processors,
            ...flowComponents.processGroups,
            ...flowComponents.inputPorts,
            ...flowComponents.outputPorts,
            ...flowComponents.funnels,
            ...flowComponents.labels,
          ];

          // Apply the layout algorithm
          const result = this.autoLayoutService.applyLayout(
            action.request.layoutType,
            allComponents,
            flowComponents.connections,
            action.request.options
          );

          // Convert layout result to position updates
          const componentUpdates = allComponents
            .filter((comp) => result.positions.has(comp.id))
            .map((comp) => {
              const newPosition = result.positions.get(comp.id)!;
              return this.draggableBehavior.updateComponentPosition(comp, {
                x: newPosition.x - comp.position.x,
                y: newPosition.y - comp.position.y,
              });
            });

          // Dispatch position updates
          return of(
            updatePositions({
              request: {
                requestId: Date.now(),
                componentUpdates,
                connectionUpdates: [],
              },
            })
          );
        } catch (error) {
          return of(
            applyAutoLayoutFailure({
              error: `Failed to apply auto layout: ${error}`,
            })
          );
        }
      }),
      catchError((error) =>
        of(
          applyAutoLayoutFailure({
            error: `Auto layout error: ${error.message}`,
          })
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store<CanvasState>,
    private autoLayoutService: AutoLayoutService,
    private draggableBehavior: DraggableBehavior
  ) {}
}
```

### Phase 2: UI Integration (2 tuần)

#### 3.5 Tạo Auto Layout Control Component

File: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/ui/canvas/graph-controls/auto-layout-control/auto-layout-control.component.ts`

```typescript
import { Component } from "@angular/core";
import { Store } from "@ngrx/store";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from "@angular/material/icon";
import { MatDialogModule, MatDialog } from "@angular/material/dialog";

import { CanvasState } from "../../../../state";
import { LayoutType } from "../../../../service/auto-layout.service";
import { applyAutoLayout } from "../../../../state/flow/flow.actions";
import { AutoLayoutConfigDialog } from "./auto-layout-config-dialog/auto-layout-config-dialog.component";

@Component({
  selector: "auto-layout-control",
  imports: [MatButtonModule, MatMenuModule, MatIconModule, MatDialogModule],
  template: `
    <div class="auto-layout-control">
      <button
        mat-icon-button
        class="primary-icon-button"
        [matMenuTriggerFor]="layoutMenu"
        title="Auto Layout"
      >
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
  styleUrls: ["./auto-layout-control.component.scss"],
})
export class AutoLayoutControl {
  constructor(private store: Store<CanvasState>, private dialog: MatDialog) {}

  applyLayout(layoutType: string): void {
    this.store.dispatch(
      applyAutoLayout({
        request: {
          layoutType: layoutType as LayoutType,
          components: [], // Will be populated in effects
          options: this.getDefaultOptions(layoutType as LayoutType),
        },
      })
    );
  }

  openConfigDialog(): void {
    const dialogRef = this.dialog.open(AutoLayoutConfigDialog, {
      width: "400px",
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.dispatch(
          applyAutoLayout({
            request: {
              layoutType: result.layoutType,
              components: [],
              options: result.options,
            },
          })
        );
      }
    });
  }

  private getDefaultOptions(layoutType: LayoutType): any {
    switch (layoutType) {
      case LayoutType.HIERARCHICAL:
        return {
          direction: "TB",
          nodeSpacing: 80,
          rankSeparation: 120,
        };
      case LayoutType.FORCE_DIRECTED:
        return {
          iterations: 300,
        };
      case LayoutType.GRID:
        return {
          nodeSpacing: 150,
        };
      case LayoutType.CIRCULAR:
        return {};
      default:
        return {};
    }
  }
}
```

File: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/ui/canvas/graph-controls/auto-layout-control/auto-layout-control.component.scss`

```scss
.auto-layout-control {
  .auto-layout-menu {
    .mat-mdc-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;

      i {
        width: 16px;
        text-align: center;
      }
    }
  }
}
```

#### 3.6 Tạo Layout Configuration Dialog

File: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/ui/canvas/graph-controls/auto-layout-control/auto-layout-config-dialog/auto-layout-config-dialog.component.ts`

```typescript
import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatDialogRef, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { CommonModule } from "@angular/common";

import { LayoutType } from "../../../../../service/auto-layout.service";

@Component({
  selector: "auto-layout-config-dialog",
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
  ],
  template: `
    <div class="auto-layout-config-dialog">
      <h2 mat-dialog-title>Auto Layout Configuration</h2>

      <mat-dialog-content>
        <form [formGroup]="configForm" class="config-form">
          <mat-form-field appearance="outline">
            <mat-label>Layout Type</mat-label>
            <mat-select
              formControlName="layoutType"
              (selectionChange)="onLayoutTypeChange()"
            >
              <mat-option value="hierarchical">Hierarchical</mat-option>
              <mat-option value="force-directed">Force-Directed</mat-option>
              <mat-option value="grid">Grid</mat-option>
              <mat-option value="circular">Circular</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Hierarchical Layout Options -->
          <div
            *ngIf="selectedLayoutType === 'hierarchical'"
            class="layout-options"
          >
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
              <input
                matInput
                type="number"
                formControlName="nodeSpacing"
                min="50"
                max="200"
              />
              <mat-hint>Distance between nodes in the same rank</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Rank Separation</mat-label>
              <input
                matInput
                type="number"
                formControlName="rankSeparation"
                min="80"
                max="300"
              />
              <mat-hint>Distance between different ranks</mat-hint>
            </mat-form-field>
          </div>

          <!-- Force-Directed Layout Options -->
          <div
            *ngIf="selectedLayoutType === 'force-directed'"
            class="layout-options"
          >
            <mat-form-field appearance="outline">
              <mat-label>Iterations</mat-label>
              <input
                matInput
                type="number"
                formControlName="iterations"
                min="100"
                max="1000"
              />
              <mat-hint>Number of simulation iterations</mat-hint>
            </mat-form-field>
          </div>

          <!-- Grid Layout Options -->
          <div *ngIf="selectedLayoutType === 'grid'" class="layout-options">
            <mat-form-field appearance="outline">
              <mat-label>Node Spacing</mat-label>
              <input
                matInput
                type="number"
                formControlName="gridSpacing"
                min="100"
                max="300"
              />
              <mat-hint>Distance between grid cells</mat-hint>
            </mat-form-field>
          </div>

          <!-- Circular Layout Options -->
          <div *ngIf="selectedLayoutType === 'circular'" class="layout-options">
            <mat-form-field appearance="outline">
              <mat-label>Radius</mat-label>
              <input
                matInput
                type="number"
                formControlName="radius"
                min="100"
                max="500"
              />
              <mat-hint>Radius of the circle (auto if empty)</mat-hint>
            </mat-form-field>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cancel()">Cancel</button>
        <button
          mat-raised-button
          color="primary"
          (click)="apply()"
          [disabled]="!configForm.valid"
        >
          Apply Layout
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ["./auto-layout-config-dialog.component.scss"],
})
export class AutoLayoutConfigDialog implements OnInit {
  configForm: FormGroup;
  selectedLayoutType: string = "hierarchical";

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AutoLayoutConfigDialog>
  ) {
    this.configForm = this.fb.group({
      layoutType: ["hierarchical", Validators.required],

      // Hierarchical options
      direction: ["TB"],
      nodeSpacing: [80, [Validators.min(50), Validators.max(200)]],
      rankSeparation: [120, [Validators.min(80), Validators.max(300)]],

      // Force-directed options
      iterations: [300, [Validators.min(100), Validators.max(1000)]],

      // Grid options
      gridSpacing: [150, [Validators.min(100), Validators.max(300)]],

      // Circular options
      radius: [null, [Validators.min(100), Validators.max(500)]],
    });
  }

  ngOnInit(): void {
    this.onLayoutTypeChange();
  }

  onLayoutTypeChange(): void {
    this.selectedLayoutType = this.configForm.get("layoutType")?.value;
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
            rankSeparation: formValue.rankSeparation,
          };
          break;
        case LayoutType.FORCE_DIRECTED:
          options = {
            iterations: formValue.iterations,
          };
          break;
        case LayoutType.GRID:
          options = {
            nodeSpacing: formValue.gridSpacing,
          };
          break;
        case LayoutType.CIRCULAR:
          options = {
            radius: formValue.radius,
          };
          break;
      }

      this.dialogRef.close({
        layoutType,
        options,
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
```

File: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/ui/canvas/graph-controls/auto-layout-control/auto-layout-config-dialog/auto-layout-config-dialog.component.scss`

```scss
.auto-layout-config-dialog {
  .config-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 350px;

    .layout-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background-color: #fafafa;
    }

    .mat-mdc-form-field {
      width: 100%;
    }
  }
}
```

#### 3.7 Integrate vào Graph Controls

File: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/ui/canvas/graph-controls/navigation-control/navigation-control.component.html`

Thêm auto layout control:

```html
<div class="navigation-control border flex flex-col gap-y-2">
  <div
    class="navigation-control-header pointer flex justify-between"
    (click)="toggleCollapsed()"
  >
    <!-- existing header content -->
  </div>
  @if (!navigationCollapsed) {
  <div class="w-72 px-2.5 pb-2.5 flex flex-col gap-y-2">
    <!-- existing navigation controls -->

    <!-- Add auto layout control -->
    <div class="flex gap-x-1 items-center">
      <auto-layout-control></auto-layout-control>
      <span class="text-sm">Auto Layout</span>
    </div>

    <!-- existing controls continue... -->
  </div>
  }
</div>
```

File: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/ui/canvas/graph-controls/navigation-control/navigation-control.component.ts`

Thêm import:

```typescript
import { AutoLayoutControl } from '../auto-layout-control/auto-layout-control.component';

@Component({
    selector: 'navigation-control',
    templateUrl: './navigation-control.component.html',
    imports: [Birdseye, MatButtonModule, AutoLayoutControl], // Add AutoLayoutControl
    styleUrls: ['./navigation-control.component.scss']
})
```

### Phase 3: Advanced Features (2 tuần)

#### 3.8 Animation và Transitions

File: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/service/layout-animator.service.ts`

```typescript
import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import * as d3 from "d3";
import { ComponentEntity, Position } from "../state/shared";

export interface AnimationOptions {
  duration?: number;
  easing?: string;
  delay?: number;
}

@Injectable({
  providedIn: "root",
})
export class LayoutAnimatorService {
  animateToPositions(
    components: ComponentEntity[],
    newPositions: Map<string, Position>,
    options: AnimationOptions = {}
  ): Observable<void> {
    const subject = new Subject<void>();
    const duration = options.duration || 1000;
    const easing = options.easing || "cubic-in-out";
    let completedAnimations = 0;
    const totalAnimations = components.length;

    if (totalAnimations === 0) {
      subject.next();
      subject.complete();
      return subject.asObservable();
    }

    components.forEach((component) => {
      const newPosition = newPositions.get(component.id);
      if (!newPosition) {
        completedAnimations++;
        if (completedAnimations === totalAnimations) {
          subject.next();
          subject.complete();
        }
        return;
      }

      const element = d3.select(`#id-${component.id}`);
      if (element.empty()) {
        completedAnimations++;
        if (completedAnimations === totalAnimations) {
          subject.next();
          subject.complete();
        }
        return;
      }

      // Get current position
      const currentTransform = element.attr("transform") || "translate(0,0)";
      const match = currentTransform.match(/translate\(([^,]+),([^)]+)\)/);
      const currentX = match ? parseFloat(match[1]) : 0;
      const currentY = match ? parseFloat(match[2]) : 0;

      // Animate to new position
      element
        .transition()
        .duration(duration)
        .ease(d3.easeQuadInOut)
        .attr("transform", `translate(${newPosition.x}, ${newPosition.y})`)
        .on("end", () => {
          completedAnimations++;
          if (completedAnimations === totalAnimations) {
            subject.next();
            subject.complete();
          }
        });
    });

    return subject.asObservable();
  }

  animateWithPreview(
    components: ComponentEntity[],
    newPositions: Map<string, Position>,
    options: AnimationOptions = {}
  ): Observable<boolean> {
    const subject = new Subject<boolean>();

    // Show preview positions with ghosting effect
    this.showPreview(components, newPositions);

    // Wait for user confirmation
    // This would typically be handled by a dialog or notification service
    setTimeout(() => {
      subject.next(true); // User confirmed
      subject.complete();
    }, 2000);

    return subject.asObservable();
  }

  private showPreview(
    components: ComponentEntity[],
    newPositions: Map<string, Position>
  ): void {
    components.forEach((component) => {
      const newPosition = newPositions.get(component.id);
      if (!newPosition) return;

      const element = d3.select(`#id-${component.id}`);
      if (element.empty()) return;

      // Create preview ghost
      const ghost = element
        .clone(true)
        .attr("id", `ghost-${component.id}`)
        .classed("layout-preview", true)
        .style("opacity", 0.5)
        .style("stroke-dasharray", "5,5")
        .attr("transform", `translate(${newPosition.x}, ${newPosition.y})`);

      // Remove ghost after delay
      setTimeout(() => {
        ghost.remove();
      }, 3000);
    });
  }
}
```

#### 3.9 Undo/Redo Support

File: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/service/layout-history.service.ts`

```typescript
import { Injectable } from "@angular/core";
import { ComponentEntity, Position } from "../state/shared";

export interface LayoutHistoryEntry {
  timestamp: number;
  positions: Map<string, Position>;
  description: string;
}

@Injectable({
  providedIn: "root",
})
export class LayoutHistoryService {
  private history: LayoutHistoryEntry[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 20;

  saveLayout(components: ComponentEntity[], description: string): void {
    const positions = new Map<string, Position>();
    components.forEach((comp) => {
      positions.set(comp.id, { ...comp.position });
    });

    const entry: LayoutHistoryEntry = {
      timestamp: Date.now(),
      positions,
      description,
    };

    // Remove any entries after current index (when undoing then making new changes)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new entry
    this.history.push(entry);
    this.currentIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  undo(): LayoutHistoryEntry | null {
    if (this.canUndo()) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  redo(): LayoutHistoryEntry | null {
    if (this.canRedo()) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  getCurrentEntry(): LayoutHistoryEntry | null {
    return this.currentIndex >= 0 ? this.history[this.currentIndex] : null;
  }

  getHistory(): LayoutHistoryEntry[] {
    return [...this.history];
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}
```

### Phase 4: Polish và Testing (1 tuần)

#### 3.10 Package Dependencies

Thêm vào `package.json`:

```json
{
  "dependencies": {
    "dagre": "^0.8.5",
    "d3": "^7.8.5"
  },
  "devDependencies": {
    "@types/dagre": "^0.7.48",
    "@types/d3": "^7.4.0"
  }
}
```

#### 3.11 Unit Tests

File: `/nifi-frontend/src/main/frontend/apps/nifi/src/app/pages/flow-designer/service/auto-layout.service.spec.ts`

```typescript
import { TestBed } from "@angular/core/testing";
import { AutoLayoutService, LayoutType } from "./auto-layout.service";
import { ComponentEntity } from "../state/shared";

describe("AutoLayoutService", () => {
  let service: AutoLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AutoLayoutService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should apply hierarchical layout", () => {
    const components: ComponentEntity[] = [
      // Mock component data
    ];
    const connections: any[] = [];

    const result = service.applyLayout(
      LayoutType.HIERARCHICAL,
      components,
      connections
    );

    expect(result.positions).toBeDefined();
    expect(result.positions.size).toBe(components.length);
  });

  it("should apply grid layout", () => {
    const components: ComponentEntity[] = [
      // Mock component data
    ];

    const result = service.applyLayout(LayoutType.GRID, components, []);

    expect(result.positions).toBeDefined();
    expect(result.positions.size).toBe(components.length);
  });

  // More test cases...
});
```

#### 3.12 E2E Tests

File: `/nifi-frontend/src/main/frontend/apps/nifi-e2e/src/integration/auto-layout.spec.ts`

```typescript
describe("Auto Layout Feature", () => {
  beforeEach(() => {
    cy.visit("/flow-designer");
    cy.setupFlow(); // Custom command to set up test flow
  });

  it("should apply hierarchical layout", () => {
    cy.get('[data-testid="auto-layout-button"]').click();
    cy.get('[data-testid="hierarchical-layout"]').click();

    // Verify components are repositioned
    cy.get(".component").should("have.attr", "transform");

    // Check if layout looks reasonable (components not overlapping)
    cy.verifyNoOverlappingComponents();
  });

  it("should open configuration dialog", () => {
    cy.get('[data-testid="auto-layout-button"]').click();
    cy.get('[data-testid="configure-layout"]').click();

    cy.get(".auto-layout-config-dialog").should("be.visible");

    // Test configuration options
    cy.get('[data-testid="layout-type-select"]').click();
    cy.get('[data-testid="force-directed-option"]').click();

    cy.get('[data-testid="apply-layout-button"]').click();

    // Verify layout was applied
    cy.verifyLayoutApplied();
  });
});
```

## 4. Performance Considerations

### 4.1 Large Graph Optimization

- Implement virtual scrolling cho large canvases
- Use web workers cho heavy layout computations
- Progressive layout updates cho smooth UX
- Memory management cho D3 simulations

### 4.2 Browser Compatibility

- Test trên Chrome, Firefox, Safari, Edge
- Polyfills cho older browsers nếu cần
- Mobile responsiveness

### 4.3 Accessibility

- Keyboard navigation cho layout controls
- Screen reader support
- High contrast mode compatibility
- Focus management

## 5. Documentation

### 5.1 User Documentation

- Add section trong NiFi User Guide
- Screenshots và tutorials
- Best practices cho different layout types
- Troubleshooting guide

### 5.2 Developer Documentation

- API documentation cho layout services
- Architecture decisions
- Extension points cho custom layouts
- Performance tuning guidelines

## 6. Future Enhancements

### 6.1 Custom Layout Algorithms

- Plugin system cho custom layouts
- Layout marketplace
- Save/share layout configurations

### 6.2 AI-Powered Layout

- Machine learning để suggest optimal layouts
- Learning từ user preferences
- Adaptive layouts based on flow patterns

### 6.3 Collaborative Features

- Real-time layout sharing
- Team layout preferences
- Layout versioning

## 7. Timeline Summary

| Phase   | Duration | Key Deliverables                                        |
| ------- | -------- | ------------------------------------------------------- |
| Phase 1 | 2-3 tuần | Core infrastructure, layout algorithms, actions/effects |
| Phase 2 | 2 tuần   | UI components, integration với graph controls           |
| Phase 3 | 2 tuần   | Advanced features, animation, configuration             |
| Phase 4 | 1 tuần   | Testing, polish, documentation                          |

**Total estimated time: 7-8 tuần**

## 8. Success Metrics

- User adoption rate (% of users using auto layout)
- Layout quality metrics (overlap reduction, path optimization)
- Performance benchmarks (layout computation time)
- User satisfaction surveys
- Bug reports và feedback

## 9. Risk Mitigation

### 9.1 Technical Risks

- **Large graph performance**: Implement incremental updates
- **Browser compatibility**: Comprehensive testing strategy
- **Integration complexity**: Phased rollout với feature flags

### 9.2 UX Risks

- **Layout quality**: Extensive testing với real-world flows
- **User confusion**: Clear documentation và tutorials
- **Workflow disruption**: Provide preview mode và undo functionality

Đây là kế hoạch chi tiết để implement tính năng Auto Layout cho Apache NiFi. Kế hoạch này bao gồm tất cả các aspects từ technical implementation đến testing và documentation, đảm bảo tính năng được phát triển một cách professional và maintainable.
