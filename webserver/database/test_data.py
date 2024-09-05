import random


nowTime = 1725547142
id1 = 11
id2 = 1

for i in range(10):
	durat = random.randrange(1, 13)
	afterwait = random.randrange(1, 23)
	print('INSERT INTO "Utilisation" (a_id, c_id, a_start_time, a_end_time, duration, is_active)')
	if i != 9 and i != 4:
		print('VALUES ('+str(id1+i)+", "+str(id2)+", "+str(nowTime)+", "+str(nowTime+durat)+", "+str(durat)+", "+"FALSE"+")")
	elif i == 4:
		print('VALUES ('+str(id1+i)+", "+str(id2)+", "+str(nowTime)+", "+str(nowTime+durat)+", "+str(durat)+", "+"TRUE"+")")
	else:
		print('VALUES ('+str(id1+i)+", "+str(id2)+", "+str(nowTime)+", "+"NULL"+", "+"NULL"+", "+"TRUE"+")")
	nowTime += durat+afterwait
