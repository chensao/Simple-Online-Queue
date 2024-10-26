# Simple-Online-Queue
Simple Online queue system, using browser fingerprint and GEO location 
# Deploy
**Prerequisites**

Install Node.js

Visit 
```
https://nodejs.org/
```

Download and install the LTS version for your operating system

**Step 1: Create Things**

In any code editors:

Create the following:


```
package.json
```

Then create a folder named 
```
public
```

**Step 2: Download / Deploy**

download, and put in project root folder
```
server.js
```
download html file, then put in public folder


Paste the following content into the package.json file (must the same folder with server.js):

```
{
  "name": "queue-app",
  "version": "1.0.0",
  "description": "Simple online queue application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.17.1",
    "socket.io": "^4.2.0"
  }
}
```

**Step 3: Install Dependencies**

Go to you server and project directory


```
npm install
```

**Step 4: Run**

then 

```
npm start
```

Operations when you see: "Server running on port 3000"

access it through: http://your-ip:3000

Troubleshooting
If you encounter issues:

Ensure Node.js is installed correctly.
Type 
```
node -v
```
 in the terminal to check the version
 
Make sure all dependencies are installed. Try deleting the node_modules folder and running npm install again

Check the console output for any error messages

Ensure your firewall is not blocking the application
