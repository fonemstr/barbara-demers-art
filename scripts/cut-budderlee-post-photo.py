# Cuts Walter's month (media/budderlee-post-walter-month-2.jpg, 2000x1638,
# shot on grey paper) out of its background for
# public/budderlee/post/walter-month-flat-lay.webp:
#   python cut-budderlee-post-photo.py photo.jpg out.png
#   magick out.png -quality 86 -define webp:alpha-quality=100 out.webp
# Needs opencv-python and numpy. GrabCut does the cutting, seeded by color;
# the edges it can't see (the frosted iron-on, pale paper margins) are pinned
# from straight lines and the sticker's ellipse measured on this photo, so a
# new photo needs those coordinates measured again.
import sys, cv2, numpy as np

img = cv2.imread(sys.argv[1]); out = sys.argv[2]
h, w = img.shape[:2]
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
yy, xx = np.mgrid[0:h, 0:w]

# The grey paper's brightness, modeled from pixels that are clearly paper.
paper = ((B <= 134) & (A <= 133) & (L < 218)).astype(np.float32)
bgL = cv2.GaussianBlur(L * paper, (0, 0), 60) / np.maximum(cv2.GaussianBlur(paper, (0, 0), 60), 1e-3)
plain_grey = (np.abs(A - 128) < 4) & (B < 134) & (B > 124) & (L < bgL + 4) & (L > bgL - 45)

# Seed: anything warm, colored, or brighter than the paper around it.
seed = ((B > 137) | (A > 136) | (L > bgL + 10)).astype(np.uint8) * 255
seed = cv2.morphologyEx(cv2.medianBlur(seed, 7), cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
cnts, _ = cv2.findContours(seed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
seed = np.zeros_like(seed)
cv2.drawContours(seed, [c for c in cnts if cv2.contourArea(c) > 20000], -1, 255, -1)

# Pinned outlines: the frosted iron-on, the gazette's front page (its top
# edge perpendicular to its straight left edge), and the slightly oval sticker.
iron = np.zeros_like(seed)
cv2.fillPoly(iron, [np.array([(345, 996), (570, 1467), (907, 1318), (682, 847)], np.int32)], 255)
gaz = np.zeros_like(seed)
cv2.fillPoly(gaz, [np.array([(156, 345), (430, 1360), (1010, 1205), (736, 190)], np.int32)], 255)
sticker = np.zeros_like(seed)
cv2.ellipse(sticker, (1558, 1092), (173, 168), 0, 0, 360, 255, -1)
seed = seed | iron | sticker
core = cv2.erode(seed, np.ones((61, 61), np.uint8)) > 0

m = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
m[cv2.dilate(seed, np.ones((61, 61), np.uint8)) == 0] = cv2.GC_BGD
m[seed > 0] = cv2.GC_PR_FGD
m[cv2.erode(seed, np.ones((31, 31), np.uint8)) > 0] = cv2.GC_FGD
near_sticker = (yy >= 850) & (xx >= 1350)
m[plain_grey & near_sticker & ~core & (sticker == 0)] = cv2.GC_BGD
m[(iron > 0) | (gaz > 0) | (sticker > 0)] = cv2.GC_FGD
# Paper below the iron-on's bottom edge and left of the gazette's left edge.
m[(xx >= 560) & (xx <= 820) & (yy > 1467 - (xx - 570) * 0.442 + 1)] = cv2.GC_BGD
m[(yy >= 345) & (yy <= 1360) & (xx < 156 + (yy - 345) * 0.27 - 1)] = cv2.GC_BGD

cv2.grabCut(img, m, None, np.zeros((1, 65)), np.zeros((1, 65)), 6, cv2.GC_INIT_WITH_MASK)
a = np.where((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

# Strip plain grey paper GrabCut kept along the edges.
plain = plain_grey & (gaz == 0) & (iron == 0) & (sticker == 0) & ~core
a[cv2.morphologyEx(plain.astype(np.uint8) * 255, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) > 0] = 0
# Straight edges where pale paper hugs the cards: the recipe card's top and
# right/bottom edges, the paper-doll sheet's top, and the gap between the
# art card's right edge and the sticker.
a[(xx >= 1360) & (xx <= 1840) & (yy < 122 + (xx - 1300) * 0.153 - 1)] = 0
a[(xx >= 1000) & (xx < 1360) & (yy < 102 + (1298 - xx) * 0.19 - 1)] = 0
below_recipe = yy > 949 + (xx - 1724) * 0.153 + 1
a[(xx > 1640) & (yy > 300) & ((xx > 1793 - (yy - 484) * 0.148 + 1) | below_recipe) & (sticker == 0)] = 0
a[(xx > 1387 + (yy - 880) * 0.048 + 1) & below_recipe & (sticker == 0)] = 0

a = cv2.morphologyEx(a, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
cnts, _ = cv2.findContours(a, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
a = np.zeros_like(a)
cv2.drawContours(a, [cv2.approxPolyDP(max(cnts, key=cv2.contourArea), 3, True)], -1, 255, -1)
a = cv2.GaussianBlur(a, (5, 5), 0)
x, y, bw, bh = cv2.boundingRect(a)
cv2.imwrite(out, np.dstack([img, a])[y:y + bh, x:x + bw])
print(bw, bh)
