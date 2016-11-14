class Blob(object):

    def __init__(self, coords):
        self.points = coords
        self.no_blobs = 1
        self.blobs = []
        self.edges = []

    def split(self):
        pass

    def pick(self):
        pass

    def __str__(self):
        s = "=====\nThis blob is: "
        for b in self.blobs:
            s += str(b) + "\n"
        s += "\n====="
        return s


def near(v1, v2):
    print(v1)
    print(v2)

    def distance():
        return abs((v1[0] - v2[0]) + (v1[0] - v2[0]))

    if (distance() < 10):
        return True

    return False


class CardBlob(Blob):
    def __init__(self, coords):
        super(CardBlob, self).__init__(coords)
        self.split()

    def split(self):
        # make sure that all the coords in a blob are touching
        for p in self.points:
            print(p)
            f = False
            for e in self.blobs:
                print(e)
                for b in e:
                    if near(p, b):
                        e.append(p)
                        f = True
                        break

            if not f:
                self.blobs.append([p])
                self.no_blobs += 1

        self.findEdges()
        self.merge()

    def findEdges(self):
        """
        An edge is either a maxx or maxy or minx or miny.
        solution: get a list of the y values with no duplicates.

        iterate through the y list and find the max and min x at each stage
        append (x,y) to the list of edges.


        alt: Each point within the blob with have 3 points above, to each side
        and below, whereas a boundary point will have 0 points adjacent to it on
        at least on of these sides.
        """

        def getYs(i):
            ys = []
            for b in self.blobs[i]:
                ys.append(b[1])
            return list(set(ys))

        for i in range (len(self.blobs)):
            ys = getYs(i)
            for y in ys:
                # find max point with (?, y)
                # find min point with (?, y)
                xs = getXs(ys)



    def pick(self):
        pass

    def merge(self):
        # make sure that two adjacent blobs are one...
        pass


b = Blob([(3, 2), (3, 4)])
print(b)
print("---")

c = CardBlob([(1, 2), (3, 4), (22, 3)])


print(c)
