from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    # Create image with blue gradient background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle (simulating app icon)
    padding = size // 8
    draw.rounded_rectangle(
        [(padding, padding), (size - padding, size - padding)],
        radius=size // 4,
        fill=(20, 30, 50), # Dark blue-grey
        outline=(59, 130, 246), # Electric blue
        width=max(1, size // 32)
    )
    
    # Draw "M" text (or simple shape if font issues)
    # Trying to draw a simple distinct shape instead of text to avoid font dependency
    # Draw a stylized "M" using lines
    center_x = size // 2
    center_y = size // 2
    w = size // 2.5
    h = size // 2.5
    
    points = [
        (center_x - w/2, center_y + h/2),  # Bottom Left
        (center_x - w/2, center_y - h/2),  # Top Left
        (center_x, center_y),              # Middle Bottom
        (center_x + w/2, center_y - h/2),  # Top Right
        (center_x + w/2, center_y + h/2),  # Bottom Right
    ]
    
    draw.line(points, fill=(255, 255, 255), width=max(1, size // 10), joint='curve')
    
    return img

def main():
    sizes = [16, 48, 128]
    output_dir = 'public'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    for size in sizes:
        img = create_icon(size)
        filename = os.path.join(output_dir, f'icon{size}.png')
        img.save(filename)
        print(f"Generated {filename}")

if __name__ == '__main__':
    main()
