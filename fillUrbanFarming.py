import pymysql

connection = pymysql.connect(host='localhost',
                             user='root',
                             password='urban2016',
                             db='tablefarming',
                             charset='utf8mb4',
                             cursorclass=pymysql.cursors.DictCursor)

try:
    with connection.cursor() as cursor:
        sql = "INSERT INTO `plant_projects` VALUES (%s, %s, %s, %s)"
        cursor.execute(sql, ('1','Jain', 'blah', '2016-08-30 11:54:39'))
    connection.commit()
    with connection.cursor() as cursor:
        sql = "SELECT `uid`, `user_name` FROM `plant_projects` WHERE `uid`=%s"
        cursor.execute(sql, ('1'))
        result = cursor.fetchone()
        print(result)
finally:
    connection.close()
