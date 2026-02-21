// Adjustable Phone/Tablet Stand
// Parametric stand with customizable angle and size

// === Device Parameters ===
device_width = 80;       // [50:200] Device width in mm
device_thickness = 12;   // [6:20] Device thickness (with case)

// === Stand Parameters ===  
stand_angle = 65;        // [45:85] Viewing angle in degrees
stand_depth = 80;        // [50:150] Base depth in mm
stand_height = 100;      // [60:200] Back support height in mm

// === Construction ===
material_thickness = 4;  // [2:0.5:8] Material thickness
slot_depth = 15;         // [10:30] How deep device sits in slot

// === Features ===
cable_hole = true;       // Add cable pass-through hole
cable_diameter = 15;     // [8:25] Cable hole diameter
add_feet = true;         // Add anti-slip feet

// === Quality ===
$fn = 48;

module stand_profile() {
    // 2D profile of the stand side
    polygon([
        [0, 0],                                          // Front bottom
        [stand_depth, 0],                                // Back bottom
        [stand_depth, material_thickness],               // Back bottom inner
        [stand_depth - material_thickness, material_thickness], // Base top back
        [slot_depth + material_thickness, material_thickness],  // Base top front (behind slot)
        [slot_depth + material_thickness, slot_depth * tan(90 - stand_angle) + material_thickness], // Slot back
        [material_thickness, slot_depth * tan(90 - stand_angle) + material_thickness + device_thickness / sin(stand_angle)], // Slot front top
        [0, slot_depth * tan(90 - stand_angle) + material_thickness], // Front face bottom of slot
        [0, 0]                                           // Close
    ]);
}

module back_support() {
    // Back angled support
    translate([stand_depth - material_thickness, 0, material_thickness]) {
        rotate([0, -90 + stand_angle, 0]) {
            cube([stand_height, device_width, material_thickness]);
        }
    }
}

module cable_cutout() {
    if (cable_hole) {
        translate([stand_depth/2, device_width/2, -1])
            cylinder(h = material_thickness + 2, d = cable_diameter);
    }
}

module foot() {
    cylinder(h = 2, d1 = 10, d2 = 8);
}

module stand() {
    difference() {
        union() {
            // Left side
            linear_extrude(material_thickness)
                stand_profile();
            
            // Right side
            translate([0, device_width - material_thickness, 0])
                linear_extrude(material_thickness)
                stand_profile();
            
            // Base plate
            cube([stand_depth, device_width, material_thickness]);
            
            // Front lip
            cube([material_thickness, device_width, slot_depth * tan(90 - stand_angle) + material_thickness]);
            
            // Back support
            back_support();
        }
        
        // Cable hole
        cable_cutout();
    }
    
    // Feet
    if (add_feet) {
        translate([10, 10, 0]) foot();
        translate([10, device_width - 10, 0]) foot();
        translate([stand_depth - 10, 10, 0]) foot();
        translate([stand_depth - 10, device_width - 10, 0]) foot();
    }
}

stand();
