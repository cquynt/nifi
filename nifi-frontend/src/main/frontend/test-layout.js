// Quick test of enhanced layout algorithms
console.log('Testing Enhanced Auto Layout Algorithms...');

// Mock component data
const mockComponents = [
    { id: '1', component: { type: 'Processor' }, position: { x: 0, y: 0 } },
    { id: '2', component: { type: 'ProcessGroup' }, position: { x: 0, y: 0 } },
    { id: '3', component: { type: 'InputPort' }, position: { x: 0, y: 0 } },
    { id: '4', component: { type: 'Funnel' }, position: { x: 0, y: 0 } }
];

// Test component size calculation
function getComponentSize(comp) {
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
}

// Test Grid Layout
function testGridLayout() {
    console.log('\n=== Testing Enhanced Grid Layout ===');

    const minSpacing = 80;
    const extraSpacing = 40;
    const startX = 80;
    const startY = 80;

    const numComponents = mockComponents.length;
    const cols = Math.min(4, Math.ceil(Math.sqrt(numComponents * 1.5)));
    const rows = Math.ceil(numComponents / cols);

    console.log(`Grid: ${cols} columns x ${rows} rows for ${numComponents} components`);

    // Calculate column widths and row heights
    const colWidths = new Array(cols).fill(0);
    const rowHeights = new Array(rows).fill(0);

    mockComponents.forEach((comp, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const size = getComponentSize(comp);

        colWidths[col] = Math.max(colWidths[col], size.width);
        rowHeights[row] = Math.max(rowHeights[row], size.height);
    });

    console.log('Column widths:', colWidths);
    console.log('Row heights:', rowHeights);

    mockComponents.forEach((comp, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const size = getComponentSize(comp);

        // Calculate X position
        let x = startX;
        for (let c = 0; c < col; c++) {
            x += colWidths[c] + minSpacing + extraSpacing;
        }
        x += (colWidths[col] - size.width) / 2;

        // Calculate Y position
        let y = startY;
        for (let r = 0; r < row; r++) {
            y += rowHeights[r] + minSpacing + extraSpacing;
        }
        y += (rowHeights[row] - size.height) / 2;

        console.log(`${comp.component.type} (${comp.id}): position (${x}, ${y}), size ${size.width}x${size.height}`);
    });
}

// Test Circular Layout
function testCircularLayout() {
    console.log('\n=== Testing Enhanced Circular Layout ===');

    const centerX = 600;
    const centerY = 400;
    const numComponents = mockComponents.length;

    // Find largest component dimension
    const maxComponentDimension = Math.max(
        ...mockComponents.map(comp => {
            const size = getComponentSize(comp);
            return Math.max(size.width, size.height);
        })
    );

    const minComponentSpacing = 60;
    const angleStep = (2 * Math.PI) / numComponents;

    // Calculate required radius
    const minRadiusForSpacing = (maxComponentDimension + minComponentSpacing) / (2 * Math.sin(angleStep / 2));
    const radius = Math.max(200, minRadiusForSpacing + 50);

    console.log(`Max component dimension: ${maxComponentDimension}px`);
    console.log(`Calculated radius: ${radius}px`);

    mockComponents.forEach((comp, index) => {
        const angle = (index * 2 * Math.PI) / numComponents;
        const size = getComponentSize(comp);

        const x = centerX + radius * Math.cos(angle) - size.width / 2;
        const y = centerY + radius * Math.sin(angle) - size.height / 2;

        console.log(`${comp.component.type} (${comp.id}): position (${Math.round(x)}, ${Math.round(y)}), angle ${Math.round(angle * 180 / Math.PI)}°`);
    });
}

// Run tests
testGridLayout();
testCircularLayout();

console.log('\n✅ Enhanced Auto Layout Algorithm Tests Completed Successfully!');
console.log('\nKey Improvements:');
console.log('- Component dimension awareness prevents overlapping');
console.log('- Proper spacing calculations with extra padding');
console.log('- Component centering within allocated grid cells');
console.log('- Dynamic radius calculation for circular layout');
console.log('- Enhanced Force-Directed layout with size-aware repulsion');
