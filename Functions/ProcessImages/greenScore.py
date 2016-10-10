# from skimage import color
import sys
import matplotlib.pyplot as plt
from skimage.io import imread
from skimage import img_as_float
import numpy as np
try:
    import Image
except ImportError:
    from PIL import Image

saveLocation = "bar.JPEG"
cardLengthmm = 75


def isRed(pixel):
    # if the green part is greater than the blue and red part.
    if pixel[0] >= (pixel[1] - 0.01) and pixel[1] >= (pixel[2] - 0.01):
        return True
    return False


def isBlue(pixel):
    # if the green part is greater than the blue and red part.
    if pixel[2] >= (pixel[1] - 0.14) and pixel[2] >= (pixel[0] - 0.14):
        return True
    return False


def isGreen(pixel):
    # if the green part is greater than the blue and red part.
    if pixel[1] >= (pixel[0] + 0.007) and pixel[1] >= (pixel[2] + 0.007):
        return True
    return False


def findThePlant(r):
    p = []
    i = r.copy()
    for y in range(r.shape[0]):
        for x in range(r.shape[1]):
            # Find the plant within the image.
            if not(isBlue(r[y][x])):
                if not(isRed(r[y][x])):
                    if (isGreen(r[y][x])):
                        # add (y, x) to the list
                        i[y][x][0] = i[y][x][1] = 1
                        p.append((y, x))
    return i, p


def readFile(f):
    r = img_as_float(imread(f))
    return r


def savePlantImage(m):
    im = Image.fromarray(np.uint8(m*255))
    im.save(saveLocation)
    return


def displayProcesses(s, r, p):
    t = True
    size = (8, 4)
    fig1, (ax5, ax6) = plt.subplots(ncols=2, figsize=size, sharex=t, sharey=t)

    ax5.imshow(r)
    ax6.imshow(p)
    ax5.set_title("original", fontsize=20)
    ax6.set_title(s, fontsize=20)

    plt.show()
    return


def getScore(p):
    return 0.5 * len(p)


def getMax(column, points):
    """
    Given the desired column - x or y, and the list of points, find the maximum
    x or y of the list of points.
    """
    m = points[0][column]
    for p in points:
        if p[column] > m:
            m = p[column]
    return m


def getMin(column, points):
    """
    Given the desired column - x or y, and the list of points, find the minimum
    x or y of the list of points.
    """
    m = points[0][column]
    for p in points:
        if p[column] < m:
            m = p[column]
    return m


def isOrange(orange, pixel):
    if pixel[0] >= (orange[0] - 0.14) and pixel[0] <= (orange[0] + 0.14):
        if pixel[2] >= (orange[2] - 0.14) and pixel[2] <= (orange[2] + 0.14):
            if pixel[1] >= (orange[1] - 0.1) and pixel[1] <= (orange[1] + 0.14):
                return True
    return False


def findCard(p):
    """
    There is an orange card in the image.
    Return the length of the card in pixels.
    The actual length of the card is 7.5cm
    """
    l = []
    orange = (234 / 255.0, 142 / 255.0, 65 / 255.0)
    print(orange)
    for x in range(p.shape[0]):
        for y in range(p.shape[1]):
            if (isOrange(orange, p[x][y])):
                p[x][y][0] = p[x][y][2] = 1
                l.append((y, x))
    x1 = getMin(0, l)
    x2 = getMax(0, l)
    return p, x2 - x1


def getWidth(p, ratio):

    maxX = getMax(0, p)
    minX = getMin(0, p)

    return (maxX - minX) * ratio


def getHeight(p, ratio):
    maxY = getMax(1, p)
    minY = getMin(1, p)
    print(ratio)
    return (maxY - minY) * ratio


def getAverageColour(column, points, image):
    x = points[0][0]
    y = points[0][1]
    total = 0
    for p in points:
        x = p[0]
        y = p[1]
        total += image[x][y][column]
    return total/len(points)


def getAveragePlantColour(p, r):
    averageR = getAverageColour(0, p, r) * 255
    averageG = getAverageColour(1, p, r) * 255
    averageB = getAverageColour(2, p, r) * 255
    return (averageR, averageG, averageB)


def getCompactness(width, height):
    # is it as high as it is tall?
    if (height == width):
        return 0
    elif (height > width):
        return 1
    else:
        return -1


def rtoh(rgb):
    return '"%s"' % ''.join(('%02x' % p for p in rgb))


def displayPheno(p):
    s = '{'

    for k in p.keys():
        s = s + '"' + str(k) + '": ' + str(p[k]) + ', '

    s = s + '"0":0 }'
    print(s)


if __name__ == '__main__':
    try:
        a = sys.argv[1]
    except:
        a = "image.jpg"

    picture = readFile(a)
    processedImage, plantPoints = findThePlant(picture)
    processedImage, length = findCard(processedImage)
    mmtopixRatio = cardLengthmm/(length+0.0)

    pheno = {}
    pheno["Score"] = getScore(plantPoints)
    pheno["Width"] = getWidth(plantPoints, mmtopixRatio)
    pheno["Height"] = getHeight(plantPoints, mmtopixRatio)
    pheno["Compactness"] = getCompactness(pheno["Width"], pheno["Height"])
    p = getAveragePlantColour(plantPoints, picture)
    pheno["AveragePlantColour"] = rtoh(p)
    pheno["saveTo"] = '"' + saveLocation + '"'
    savePlantImage(processedImage)

    displayPheno(pheno)
    displayProcesses(pheno["Score"], picture, processedImage)

    sys.stdout.flush()
