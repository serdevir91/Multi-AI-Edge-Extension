from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import math

def create_gradient_background(size, color1, color2):
    """Creates a radial gradient background."""
    img = Image.new('RGB', (size, size), color1)
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size // 2, size // 2
    max_dist = math.sqrt(center_x**2 + center_y**2)
    
    for y in range(size):
        for x in range(size):
            dist = math.sqrt((x - center_x)**2 + (y - center_y)**2)
            ratio = dist / max_dist
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            draw.point((x, y), fill=(r, g, b))
            
    return img

def draw_hexagon(draw, center, size, color, width=0):
    """Draws a hexagon."""
    angle_step = 60
    points = []
    for i in range(6):
        angle_rad = math.radians(angle_step * i - 30) # Rotate 30 deg for flat top/bottom
        x = center[0] + size * math.cos(angle_rad)
        y = center[1] + size * math.sin(angle_rad)
        points.append((x, y))
    
    draw.polygon(points, outline=color, width=width)
    return points

def create_icon(size):
    # Professional Blue Gradient
    # Deep Blue (Start) -> Darker Navy (End)
    bg_color_start = (37, 99, 235)  # #2563EB (Blue 600)
    bg_color_end = (30, 58, 138)    # #1E3A8A (Blue 900)
    
    # 1. Background with Gradient
    img = create_gradient_background(size, bg_color_start, bg_color_end).convert("RGBA")
    draw = ImageDraw.Draw(img)
    
    # 2. Central Network/AI Graphic (Hexagon + Nodes)
    center = (size // 2, size // 2)
    hex_size = size * 0.35
    
    # Draw main hexagon
    hex_points = draw_hexagon(draw, center, hex_size, (255, 255, 255), width=max(1, size // 20))
    
    # Draw connections to center
    for point in hex_points:
        draw.line([center, point], fill=(255, 255, 255, 180), width=max(1, size // 40))
        
    # Draw nodes at vertices
    node_radius = size // 25
    for point in hex_points:
        x, y = point
        draw.ellipse(
            (x - node_radius, y - node_radius, x + node_radius, y + node_radius),
            fill=(255, 255, 255),
            outline=(30, 58, 138),
            width=max(1, size // 60)
        )
        
    # Center Node
    center_node_radius = size // 12
    draw.ellipse(
        (center[0] - center_node_radius, center[1] - center_node_radius, 
         center[0] + center_node_radius, center[1] + center_node_radius),
        fill=(255, 255, 255),
        outline=(59, 130, 246), # Electric Blue
        width=max(1, size // 40)
    )

    # 3. Apply Rounded Corners (Masking)
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        [(0, 0), (size, size)], 
        radius=size // 5, 
        fill=255
    )
    
    # 4. Glossy Shine Effect
    shine = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    shine_draw = ImageDraw.Draw(shine)
    shine_draw.ellipse(
        (-size * 0.2, -size * 0.2, size * 0.8, size * 0.5),
        fill=(255, 255, 255, 30)
    )
    
    # Composite
    final_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    final_img.paste(img, (0, 0), mask=mask)
    if size > 32: # Only add shine on larger icons
        final_img = Image.alpha_composite(final_img, shine)
        # Re-apply mask to cut off shine
        temp = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        temp.paste(final_img, (0, 0), mask=mask)
        final_img = temp

    return final_img

def main():
    sizes = [16, 32, 48, 128, 512] # Added 512 for store listing
    output_dir = 'public'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    for size in sizes:
        img = create_icon(size)
        filename = os.path.join(output_dir, f'icon{size}.png')
        img.save(filename, "PNG")
        print(f"Generated {filename}")

if __name__ == '__main__':
    main()
