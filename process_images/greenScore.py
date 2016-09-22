# from skimage import color
import sys
try:
    import Image
except ImportError:
    from PIL import Image
import matplotlib.pyplot as plt
from skimage.io import imread
from skimage import img_as_float
import numpy as np

# image = [0, 0, 0] * r
score = [0]*7
# Construct some test data


def tooGray(pixel, i):
    if pixel[0] <= (pixel[2] + 0.21) and pixel[0] >= (pixel[2] - 0.21):
        i[1] = 1
        # if pixel[1] <= (pixel[2] + 0.02) and pixel[1] >= (pixel[2] - 0.32):
        if pixel[1] <= (pixel[2] + 0.12) and pixel[1] >= (pixel[2] - 0.32):
            i[0] = 1
            return True
    return False


def tooLight(pixel, thres):
    if pixel[0] < thres[0] and pixel[2] < thres[2] and pixel[1] < thres[1]:
        return True
    return False


def tooDark(pixel, thres2):
    if pixel[0] >= thres2[0] and pixel[2] >= thres2[2] and pixel[1] >= thres2[1]:
        return True
    return False



def filter(e, f, r):
    s = 0
    filt2 = [0.9, 0.9, 0.9]
    filt = [0.3, 0.3, 0.3]
    i = r.copy()
    for y in range(r.shape[0]):
        for x in range(r.shape[1]):
            if (tooGray(r[y][x], i[y][x])):
                #i[y][x][0] = 1          # red
                #if not(tooDark(r[y][x], filt2)):
                #    i[y][x][1] = 1      # green
                #    if not(tooLight(r[y][x], filt)):
                #        i[y][x][2] = 1  # blue
                s += 0.5
    score[e] = s
    return i, s


def getScore(f):
    r = img_as_float(imread(f))
    t = True
    s = (8, 4)
    fig1, (ax5, ax6) = plt.subplots(ncols=2, figsize=s, sharex=t, sharey=t)

    # if less; not green enough
    rThreshold = 0.30
    gThreshold = 0.50
    bThreshold = 0.30

    thres = np.array([rThreshold, gThreshold, bThreshold])
    thres2 = np.array([0.4, 0.9, 0.3])

    m, s = filter(5, np.array([1, 1, 1]), r)
    im = Image.fromarray(np.uint8(m*255))
    im.save("/home/karen/Repos/UrbanFarming/public/foo1.JPEG")
    #ax5.imshow(r)
    #ax6.imshow(m)
    ##ax5.set_title("original", fontsize=20)
    #ax6.set_title(score[5], fontsize=20)

    #plt.show()
    return score[5]

if __name__ == '__main__':
    try:
        a = sys.argv[1]
    except:
        a = "/home/karen/Repos/UrbanFarming/public/foo.jpg"
    print(getScore(a))
    sys.stdout.flush()
