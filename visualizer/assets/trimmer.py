import csv
import glob
import os

csvs = glob.glob('./*.csv')

for file in csvs:

    new_file = os.path.join('./edits',os.path.basename(file))

    with open(file, 'rt') as inp, open(new_file, 'wt') as out:
        writer = csv.writer(out)
        for row in csv.reader(inp):
            if float(row[0]) <= 400:
                writer.writerow(row)
            else:
                break;