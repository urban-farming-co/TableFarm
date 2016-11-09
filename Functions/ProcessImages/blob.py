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
        s = ""
        for b in self.blobs:
            s += b + "\n"

        return s


def near(v1, v2):
    def distance():
        return abs((v1[0] - v2[0]) + (v1[0] - v2[0]))

    if (distance(v1, v2) < 10):
        return True

    return False


class CardBlob(Blob):
    def __init__(self, coords):
        super(CardBlob, self).__init__(coords)

    def split(self):
        # make sure that all the coords in a blob are touching
        for p in self.points:
            f = False
            for e in self.blobs:
                if near(p, self.blobs[e]):
                    self.blobs[e].append(p)
                    f = True
                    break

            if not f:
                self.blobs += [p]
                self.no_blobs += 1

        print(self)
        self.merge()

    def pick(self):
        pass

    def merge(self):
        # make sure that two adjacent blobs are one...
        pass


b = Blob([(3,2), (3,4)])
print(b)

c = CardBlob([(1,2), (3,4)])
print(c)
