// Parametric Box with Lid
// A customizable storage box for 3D printing

// === Box Parameters ===
width = 60;              // [20:200] Width in mm
depth = 40;              // [20:200] Depth in mm
height = 30;             // [10:150] Height in mm
wall_thickness = 2;      // [1:0.5:5] Wall thickness in mm

// === Lid Parameters ===
include_lid = true;      // Include a separate lid
lid_height = 8;          // [5:30] Lid height in mm
lid_tolerance = 0.3;     // [0.1:0.1:0.8] Gap for lid fit

// === Style Options ===
corner_radius = 3;       // [0:10] Corner rounding radius
add_grip = true;         // Add grip indents to lid

// === Internal ===
$fn = 32;                // Smoothness

// Rounded box module
module rounded_box(w, d, h, r) {
    if (r > 0) {
        hull() {
            for (x = [r, w-r]) {
                for (y = [r, d-r]) {
                    translate([x, y, 0])
                        cylinder(h = h, r = r);
                }
            }
        }
    } else {
        cube([w, d, h]);
    }
}

// Main box body
module box_body() {
    difference() {
        rounded_box(width, depth, height, corner_radius);
        
        // Hollow inside
        translate([wall_thickness, wall_thickness, wall_thickness])
            rounded_box(
                width - 2*wall_thickness,
                depth - 2*wall_thickness,
                height,  // Open top
                max(0, corner_radius - wall_thickness)
            );
    }
}

// Lid
module lid() {
    inner_w = width - 2*wall_thickness - 2*lid_tolerance;
    inner_d = depth - 2*wall_thickness - 2*lid_tolerance;
    lip_height = lid_height * 0.6;
    
    difference() {
        union() {
            // Top cap
            rounded_box(width, depth, wall_thickness, corner_radius);
            
            // Inner lip
            translate([wall_thickness + lid_tolerance, wall_thickness + lid_tolerance, -lip_height + wall_thickness])
                rounded_box(inner_w, inner_d, lip_height, max(0, corner_radius - wall_thickness));
        }
        
        // Grip indents
        if (add_grip) {
            for (x = [width * 0.3, width * 0.7]) {
                translate([x, -1, wall_thickness/2])
                    rotate([-90, 0, 0])
                    cylinder(h = 5, r = 3, $fn = 16);
                translate([x, depth - 4, wall_thickness/2])
                    rotate([-90, 0, 0])
                    cylinder(h = 5, r = 3, $fn = 16);
            }
        }
    }
}

// Render
box_body();

if (include_lid) {
    // Position lid next to box for printing
    translate([width + 10, 0, lid_height - wall_thickness])
        rotate([180, 0, 0])
        lid();
}
