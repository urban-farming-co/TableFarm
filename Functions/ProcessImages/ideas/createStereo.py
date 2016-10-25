from __future__ import print_function
import numpy as np
import sys
import os
import cv2
# from matplotlib import pyplot as plt


ply_header = '''ply
format ascii 1.0
element vertex %(vert_num)d
property float x
property float y
property float z
property uchar red
property uchar green
property uchar blue
element face %(face_num)d
property list uchar int vertex_indices
end_header
'''


def findKNearestNeighbours(K, verts, indexOfV1):
    def distance(v2):
        return abs(v1[0] - v2[0]) + abs(v1[1] - v2[1]) + abs(v1[2] - v2[2])
    v1 = verts[indexOfV1]
    ds = []
    for k in range(verts.shape[0]):
        d = distance(verts[k])
        if d > 0:
            ds.append((d, k))


    ds.sort(key=lambda tup: tup[0])

    def flattenit(a):
        return a[1]
    r = map(flattenit, ds)

    return r[:K]


def findFaces(verts, dispartityMap):
    M, N = verts.shape
    print(verts.shape)
    print("M is %f and N is %f " % (M, N))
    sides = 2  #  2 vertices plus the current one.
    size = (M-1, sides + 2)
    print("M is %f and N is %f " % size)
    faces = np.zeros(size, dtype="int32")
    print(faces.shape)
    for m in range(faces.shape[0]):      # x
        tri = [sides + 1, m] + findKNearestNeighbours(sides, verts, m)
        faces[m] = tri
        print(tri)
        print("Finished %d out of %d" % (m, verts.shape[0]))
        sys.stdout.flush()
    print("done")
    print(faces.shape)
    return sides, faces


def write_ply(fn, verts, colors, faces, sides):
    verts = verts.reshape(-1, 3)
    colors = colors.reshape(-1, 3)
    print(colors[0][0])
    verts = np.hstack([verts, colors])
    sides += 1
    with open(fn, 'wb') as f:
        f.write((ply_header % dict(face_num=len(faces), vert_num=len(verts))).encode('utf-8'))
        fFmat = "%d " + ("%d " * sides)
        np.savetxt(f, verts, fmt='%f %f %f %d %d %d ')
        np.savetxt(f, faces, fmt=fFmat)
    print("done")
    sys.stdout.flush()


def doTheThing(l, r):
    print(os.path.isfile(l))
    print(os.path.isfile(r))
    print('loading images...')
    imgL = cv2.pyrDown(cv2.imread(l))
    imgR = cv2.pyrDown(cv2.imread(r))

    window_size = 3
    min_disp = 16
    num_disp = 112-min_disp
    stereo = cv2.StereoSGBM(minDisparity=min_disp,
                            SADWindowSize=window_size,
                            numDisparities=num_disp,
                            P1=8*3*window_size**2,
                            P2=32*3*window_size**2,
                            disp12MaxDiff=1,
                            uniquenessRatio=10,
                            speckleWindowSize=100,
                            speckleRange=32
                            )

    print('computing disparity...')
    disp = stereo.compute(imgL, imgR).astype(np.float32) / 16.0
    saveModel(disp)
    print('generating 3d point cloud...')
    h, w = imgL.shape[:2]
    f = 0.8*w                          # guess for focal length
    Q = np.float32([[1, 0, 0, -0.5*w],
                    [0, -1, 0,  0.5*h],  # turn points 180 deg around x-axis,
                    [0, 0, 0, -f],  # so that y-axis looks up
                    [0, 0, 1, 0]]
                   )
    points = cv2.reprojectImageTo3D(disp, Q)
    colors = cv2.cvtColor(imgL, cv2.COLOR_BGR2RGB)
    mask = disp > disp.min()
    out_points = points[mask]
    out_colors = colors[mask]
    out_fn = saveFolder + 'out.ply'
    sides, faces = findFaces(out_points, disp)
    write_ply(out_fn, out_points, out_colors, faces, sides)
    print('%s saved' % 'out.ply')

    cv2.imshow('left', imgL)
    cv2.imshow('disparity', (disp-min_disp)/num_disp)
    cv2.waitKey()
    cv2.destroyAllWindows()


def saveModel(image, fileName="disparity.jpg"):
    try:
        image = image
        print(image[0])
        cv2.imwrite(saveFolder + fileName, image)
    except:
        print("woops")

root = "Functions/ProcessImages/ideas/"
saveFolder = "/home/karen/Repos/UrbanFarming/public/"


if __name__ == "__main__":
    try:
        r = sys.argv[2]
        l = sys.argv[1]
        print(r)
        print(l)
        cv2.imread(l )  # cause exception if l is not a file.

        sys.stdout.flush()
    except:

        if (os.path.isfile(root+"right.jpg")):
            r = root + "right.jpg"
            l = root + "left.jpg"
        else:

            r = "right.jpg"
            l = "left.jpg"

    doTheThing(l, r)
    sys.stdout.flush()
    sys.stderr.flush()
