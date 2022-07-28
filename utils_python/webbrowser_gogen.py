#! python3
import webbrowser, sys

if len(sys.argv) > 1:
    address = ' '.join(sys.argv[1:])
else:
    address = ''

webbrowser.open('https://gogen-ejd.info/' + address)
