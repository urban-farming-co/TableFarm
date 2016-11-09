# from skimage import color
import sys
import matplotlib.pyplot as plt
from skimage.io import imread
from skimage import img_as_float
import numpy as np
import blob

try:
    import Image
except ImportError:
    from PIL import Image

saveLocation = "bar.JPEG"
cardLengthmm = 50 # mm


def isColour(lightColour, darkColour, pixel):
    if (pixel[0] < (pixel[1] + 0.15)):
        if (pixel[0] > (pixel[1] - 0.15)):
            if (pixel[1] < (pixel[0] + 0.15)):
                if (pixel[1] > (pixel[0] - 0.15)):
                    if (pixel[2] < (pixel[1] + 0.15)):
                        if (pixel[2] > (pixel[1] - 0.15)):
                            return False

    if pixel[0] >= darkColour[0] and pixel[0] <= lightColour[0]:
        if pixel[2] >= darkColour[2] and pixel[2] <= lightColour[2]:
            if pixel[1] >= darkColour[1] and pixel[1] <= lightColour[1]:
                return True
    return False


def findThePlant(r):

    p = []
    i = r.copy()

    # greenlight = (1, 1, 1)
    # greendark = (0, 0, 0)

    greenlight = (0.6, 0.7, 0.3)
    greendark  = (0.1, 0.3, 0)
    for y in range(r.shape[0]):
        for x in range(r.shape[1]):
            # Find the plant within the image.
            if (isColour(greenlight, greendark, r[y][x])):
                # add (y, x) to the list
                i[y][x][0] = i[y][x][1] = 1
                p.append((y, x))


    return i, p


def normalizeImage(r):
    i = r.copy()
    for x in range(r.shape[0]):
        for y in range(r.shape[1]):
            R = r[x][y][0]
            G = r[x][y][1]
            B = r[x][y][2]
            l = (R * 47.448268554 +
                 G * 119.950518949 +
                 B * 11.601212497)
            # (xm -x)(xm+x)
            desiredBrightness =400
            f = desiredBrightness - l  # 100000 is like the top luminosity

            # Desired red brightnes:
            Dr = f / 4.7
            Dg = f / 12
            Db = f / 1.2
            i[x][y][0] = 1 - Dr*(-Dr)*R
            i[x][y][1] = 1 - Dg*(-Dg)*G
            i[x][y][2] = 1 - Db*(-Db)*B
            """
            i[x][y][0] = R + abs((Dr - R) * (1-R) / (Dr + R))  # + (R * f / 2550) * (R * f / 2550)
            i[x][y][1] = G + abs((Dg - G) * (1-G) / (Dg + G))  # + (B * f / 2550) * (B * f / 2550)
            i[x][y][2] = B + abs((Db - B) * (1-B) / (Db + B))  # + (G * f / 2550) * (G * f / 2550)

            # add (y, x) to the list
            i[y][x][0] = (R * lum - 120 * G - 12 * B) / (47.0 *    500000)
            i[y][x][1] = (2*G * lum - 12 * B - 47 * R)  / (120.0 * 500000)
            i[y][x][2] = (B * lum - 47 * R - 120 * G) /( 12.0 *    500000)
            lddum /= (255)
            i[y][x][0] = ((R * lum) / 47.0 ) / 255 + 2 *R / 255
            i[y][x][1] = ((G * lum) / 120.0) / 255 + 2 *G / 255
            i[y][x][2] = ((B * lum) / 12.0)  / 255 + 2 *B / 255
            R = pixel[0]
            G = pixel[1]
            B = pixel[2]

            i[y][x][0] =  R * R * lum + ((-120 * G - 12 * B)/4.7)
            i[y][x][1] =  G * G * lum + ((-12 * B - 47 * R)/12.0)
            i[y][x][2] =  B * B * lum  + ((-47 * R - 120 * G)/1.2)
            """

    i = ensureCorrectRange(i)

    i *= (1, 0.7, 1)
    return i


def getMinColour(column,  image):
    minC = image[0][0][column]

    for x in range(image.shape[0]):
        for y in range(image.shape[1]):
            if (minC > image[x][y][column]):
                minC = image[x][y][column]

    return minC


def getMaxColour(column, image):
    maxC = image[0][0][column]
    for x in range(image.shape[0]):
        for y in range(image.shape[1]):
            if (maxC < image[x][y][column]):
                maxC = image[x][y][column]

    return maxC


def ensureCorrectRange(i):
    maxR = getMaxColour(0, i)
    minR = getMinColour(0, i)
    maxG = getMaxColour(1, i)
    minG = getMinColour(1, i)
    maxB = getMaxColour(2, i)
    minB = getMinColour(2, i)

    for x in range(i.shape[0]):
        for y in range(i.shape[1]):
            i[x][y][0] = (i[x][y][0] - minR) / (maxR - minR)
            i[x][y][1] = (i[x][y][1] - minG) / (maxG - minG)
            i[x][y][2] = (i[x][y][2] - minB) / (maxB - minB)

    return i


def readFile(f):
    r = img_as_float(imread(f))
    return r


def savePlantImage(m):
    im = Image.fromarray(np.uint8(m*255))
    im.save(saveLocation)
    return


def displayProcesses(s, r, p, p1, p2):
    t = True
    size = (8, 4)
    fig1, (ax, ax1,ax2, ax3) = plt.subplots(ncols=4, figsize=size, sharex=t, sharey=t)

    ax.imshow(r)
    ax1.imshow(p)
    ax2.imshow(p1)
    ax3.imshow(p2)
    ax.set_title("original", fontsize=20)
    ax1.set_title(s, fontsize=20)

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


def findCard(r):
    """
    There is an orange card in the image.
    Return the length of the card in pixels.
    The actual length of the card is 7.5cm
    """
    l = []
    p = r.copy()
    # p *= (0.7, 0.7, 0.7)
    orangelight = (1, 0.5, 0.5)
    orangedark = (0.62, 0.2, 0.1)
    # orangelight = (1,1,1)
    # orangedark = (0, 0, 0)
    for x in range(p.shape[0]):
        for y in range(p.shape[1]):
            if (isColour(orangelight, orangedark, p[x][y])):
                print(r[x][y])
                print("x is %d and y is %d " % (x, y))
                p[x][y][0] = 1
                p[x][y][2] = 1
                l.append((x, y))

    try:
        orange_blob = blob.CardBlob(l)
        print("init")

        orange_blob.split()
        orange_blob.pick()

        print(orange_blob)
    except:
        print("gahh!")

    x1 = getMin(0, l)
    x2 = getMax(0, l)
    print (x2 -x1)

    return p, x2 - x1


def getWidth(p, ratio):

    maxX = getMax(0, p)
    minX = getMin(0, p)

    return (maxX - minX) * ratio


def getHeight(p, ratio):
    maxY = getMax(1, p)
    minY = getMin(1, p)

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
        a = "../../public/foo.jpg"

    picture = readFile(a)
    normalized = normalizeImage(picture)
    plantImage, plantPoints = findThePlant(normalized)
    pheno = {}

    try:
        cardImage, length = findCard(normalized)
        mmtopixRatio = cardLengthmm/(length+0.0)
        pheno["ratioError"] = 0
    except:
        cardImage = normalized.copy()

        cardImage *= (0.7, 0.7, 0.7)
        mmtopixRatio = 1
        length =1
        pheno["ratioError"] = 1

    pheno["file"]  = '"' + a + '"'
    pheno["Score"] = getScore(plantPoints)
    pheno["Width"] = getWidth(plantPoints, mmtopixRatio)
    pheno["Height"] = getHeight(plantPoints, mmtopixRatio)
    pheno["Compactness"] = getCompactness(pheno["Width"], pheno["Height"])
    p = getAveragePlantColour(plantPoints, picture)
    pheno["AveragePlantColour"] = rtoh(p)
    pheno["saveTo"] = '"' + saveLocation + '"'
    savePlantImage(plantImage)

    print("the card length is: %d so the ratio is %d "% (length, mmtopixRatio))

    displayPheno(pheno)
    displayProcesses(pheno["Score"], picture, normalized, cardImage, plantImage)

    sys.stdout.flush()
