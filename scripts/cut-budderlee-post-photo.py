import sys, cv2, numpy as np
img = cv2.imread(sys.argv[1]); out = sys.argv[2]
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(int)
fg = ((lab[...,1] > 124) & (lab[...,0] > 70)).astype(np.uint8)*255
fg = cv2.medianBlur(fg, 9)
fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((9,9),np.uint8))
fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((31,31),np.uint8))
cnts,_ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
a = np.zeros(fg.shape, np.uint8); cv2.drawContours(a, [max(cnts, key=cv2.contourArea)], -1, 255, -1)
# The gazette's dark chalkboard corner reads as background; its straight
# left and bottom edges are recovered from the hull of the left strip.
left = a.copy(); left[:, 440:] = 0
pts = cv2.findNonZero(left); cv2.fillConvexPoly(a, cv2.convexHull(pts), 255)
# Greenery shows in the gap between the gazette and the paper doll; the
# morphological close bridged it, so clear the green pixels there.
gap = np.zeros_like(a); gap[100:400, 688:722] = 1
bg = (lab[...,1] <= 126) | (lab[...,0] <= 80)
bg = cv2.dilate(bg.astype(np.uint8), np.ones((5,5),np.uint8)).astype(bool)
a[(gap == 1) & bg] = 0
# The round sticker's cream rim reads as background and its bottom edge
# was cut away; find the sticker and add it back as the circle it is.
g = cv2.medianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 5)
c = cv2.HoughCircles(g[650:1050, 350:800], cv2.HOUGH_GRADIENT, 1.2, 200, param1=120, param2=40, minRadius=90, maxRadius=150)
cx, cy, r = c[0][0]; cv2.circle(a, (int(cx) + 350, int(cy) + 650), int(r) + 5, 255, -1)
a = cv2.erode(a, np.ones((5,5),np.uint8)); a = cv2.GaussianBlur(a, (5,5), 0)
x,y,w,h = cv2.boundingRect(a)
cv2.imwrite(out, np.dstack([img, a])[y:y+h, x:x+w]); print(w, h)
