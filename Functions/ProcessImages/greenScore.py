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

saveLocation = "bar.JPEG"

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


def getWidth(p):
    """ TODO
     Calulate the actual width using some sort of marker:
    - edges of the plant pot,
    - a piece of card - this would translate the clips on the tripod.

    """
    maxX = getMax(0, p)
    minX = getMin(0, p)
    return maxX - minX


def getHeight(p):
    """ TODO
     Calulate the actual width using some sort of marker:
    - edges of the plant pot,
    - a piece of card - this would translate the clips on the tripod.

    """
    maxY = getMax(1, p)
    minY = getMin(1, p)
    return maxY - minY


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
    pheno = {}
    pheno["Score"] = getScore(plantPoints)
    pheno["Width"] = getWidth(plantPoints)
    pheno["Height"] = getHeight(plantPoints)
    pheno["Compactness"] = getCompactness(pheno["Width"], pheno["Height"])
    p = getAveragePlantColour(plantPoints, picture)
    pheno["AveragePlantColour"] = rtoh(p)
    pheno["saveTo"] = '"' + saveLocation + '"'
    savePlantImage(processedImage)

    displayPheno(pheno)

    sys.stdout.flush()
