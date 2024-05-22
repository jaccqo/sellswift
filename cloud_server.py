from flask import Flask, request, jsonify
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from termcolor import colored
import colorama
import time
import requests
from bson import json_util
import json
from bson.objectid import ObjectId

colorama.init()

app = Flask(__name__)

client = MongoClient("mongodb://jack:jacko@localhost:27017")

def get_location_by_ip(ip):
    # change on production
    ip="102.212.29.26"

    try:
        # Make a GET request to the ipinfo.io API with the IP address
        response = requests.get(f"http://ipinfo.io/{ip}/json")
        # If the request is successful (status code 200), parse the JSON response
        if response.status_code == 200:
            location_data = response.json()
            # Extract relevant information from the response ( city, region, country)
            city = location_data.get('city')
            region = location_data.get('region')
            country = location_data.get('country')
            return {
                'city': city,
                'region': region,
                'country': country
            }
        else:
            # If the request fails, print an error message and return None
            print(f"Failed to get location for IP {ip}. Status code: {response.status_code}")
            return None
    except Exception as e:
        # If an exception occurs, print the error message and return None
        print(f"An error occurred: {e}")
        return None


    
@app.route("/add-user", methods=["POST"])
def add_user():
    data = request.json  # Access JSON data sent from client
    #print(data)
    # Extract data fields as needed
    fullname = data.get("fullname")
    organization = data.get("organization")
    email = data.get("email")
    password = data.get("password")
    sessionID=data.get("sessionID")
    ip=data.get("ipAddress")
    accepted_terms=data.get("acceptTerms")
    is_admin = data.get("isAdminUser")


    db_name = organization  # Variable for the database name
    db = client[db_name]  # Use the variable for the database
    collection_name = "users"  # Variable for the collection name
    collection = db[collection_name]  # Use the variable for the collection

    # Check if the username or email already exists
    if collection.find_one({"$and": [ {"email": email}, {"organization": organization}]}):

        print(colored(f"Failed to add user '{fullname} email {email}'. User already exists. IP: {ip} at {datetime.datetime.now()}", "red"))
        return jsonify({"error": f"User with this email already exists in {organization}"}), 400

    # If username and email are unique, proceed to add the user
    if email and password:
        # Hash the password before storing it
        hashed_password = generate_password_hash(password)

        collection.insert_one({
            "fullname": fullname,
            "organization": organization,
            "email": email,
            "is_admin": is_admin,
            "password": hashed_password,  # Store the hashed password in the database
            "sessionID":sessionID,
            "accepted_terms":accepted_terms,
            "ip": ip,  # Log the IP address
            "last_login":datetime.datetime.now(),
            "login_location": get_location_by_ip(ip),

        })

        print(colored(f"User '{fullname}' added successfully. IP: {ip} at {datetime.datetime.now()}", "green"))
    

        return jsonify({"message": "User added successfully","sessionID":sessionID,"status":"success"}), 200
    else:
        print(colored(f"Invalid request to add user. IP: {ip} at {datetime.datetime.now()}", "yellow"))
        return jsonify({"error": "Invalid request"}), 400

@app.route('/login', methods=['POST'])
def login():
    # Get the username, password, and organization from the request JSON data
    organization = request.form.get('organization')
    email = request.form.get('email')
    password = request.form.get('password')
    remember = request.form.get('remember')

    ip = request.remote_addr

    # Connect to MongoDB
    db = client[organization]  # Use the organization as the database name
    collection = db["users"]  # Use "users" collection

    # Query the database to find the user
    user = collection.find_one({"email": email})

    if user:
        # Check if the provided password matches the hashed password in the database
        if check_password_hash(user['password'], password):
            # Password is correct, return success message with status code 200
            print(colored(f"User '{email}' logged in successfully. IP: {ip} at {datetime.datetime.now()}", "green"))

            collection.update_one({"email": email}, {"$set": {"last_login": datetime.datetime.now(), "login_location": get_location_by_ip(ip), "ip": ip}})

            return jsonify({"success": True, "message": "Login successful", "email": user["email"],"sessionID":user["sessionID"],"org":user["organization"],"remember_me":remember}), 200
        else:
            # Password is incorrect, return error message with status code 401
            print(colored(f"Invalid password for user '{email}'. IP: {ip} at {datetime.datetime.now()}", "red"))
            return jsonify({"success": False, "message": "Invalid username or password"}), 401
    else:
        # User not found, return error message with status code 404
        print(colored(f"User '{email}' not found. IP: {ip} at {datetime.datetime.now()}", "yellow"))
        return jsonify({"success": False, "message": "User not found"}), 404


@app.route('/verifyUser', methods=['POST'])
def verify_user():
    try:
        data = request.json


        cookie = data['cookie']

        organization = data['organization']
        ip = request.remote_addr

        # Connect to the appropriate database based on the organization value
        db = client[organization]

        collection=db["users"]

        # Search for the user in the users collection
        user = collection.find_one({'sessionID': cookie})

        if user:
            collection.update_one({"email": user["email"]}, {"$set": {"last_login": datetime.datetime.now(), "login_location": get_location_by_ip(ip), "ip": ip}})

            return jsonify({'status': 'success', 'message': 'User verified'}),200
        else:
            return jsonify({'status': 'error', 'message': 'User not found'}),404

    except Exception as e:
        print(e)
        return jsonify({'status': 'error', 'message': str(e)}),500
    
@app.route('/test_connection', methods=['GET'])
def test_connection():
    try:
        
        return 'Connection successful!',200

    except Exception as e:
        # If there's an exception (connection failed), return an error message
        return f'Connection failed: {str(e)}', 500



@app.route('/api/items', methods=['POST'])
def insert_item():
    try:
        data = request.get_json()
       
        # Ensure "organization" field exists in data
        if "organization" not in data:
            return jsonify({'error': 'Missing "organization" field in request'}), 400

        organization = data["organization"]
        del data["organization"]  # Remove the "organization" field from the data

        db = client[organization]
        collection = db["inventory"]

        # Extract barcode information
        new_barcode = data.pop("barcode", None)  # Remove "barcode" field from data and get its value

        if new_barcode:
            data["barcodes"] = [new_barcode]  # Create a new list with the new barcode
        else:
          
            data["barcodes"] = []  # Ensure "barcodes" field exists even if no new barcode provided

        # Check if an item with the same id and name exists
        existing_item = collection.find_one({"category": data["category"], "name": data["name"],"price": data["price"]})

        if existing_item:
            # Item already exists, update the stock and add new barcode
            new_stock = existing_item["stock"] + 1
            existing_barcodes = existing_item.get("barcodes", [])  # Get existing barcodes or an empty list if not present

            if new_barcode:
                existing_barcodes.append(new_barcode)  # Append the new barcode to existing barcodes

            collection.update_one({"_id": existing_item["_id"]}, {"$set": {"stock": new_stock, "barcodes": existing_barcodes}})
        else:
            # Item does not exist, insert it into the database
            data["stock"]=0

            item_result = collection.insert_one(data)

        return jsonify({'message': 'Item inserted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-items', methods=['GET'])
def get_all_items():
    try:
        # Get the database name from the query parameter
        db_name = request.args.get('dbname')
 
        # If the database name is not provided, return an error
        if not db_name:
            return jsonify({'error': 'Database name not provided in query parameter'}), 400

        # Retrieve all items from the inventory collection in the specified database
        db = client[db_name]


        items = list(db["inventory"].find({}))

        inventory_items=[]

        for item in items:

            item["image"]=item.get("image")

            item['_id']=str(item.get("_id"))

            inventory_items.append(item)
    
        return jsonify(inventory_items), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/delete-inventory', methods=['POST'])
def delete_inventory():
    try:
     
        data = request.get_json()  # Get the JSON data from the request body
  

        inventory_id = data.get('inventory_id')  # Get the inventory_id from the data
        dbname = data.get('dbname')  # Get the dbname from the data

        # Perform the deletion operation here using the inventory_id and dbname
        # Example:
        db = client[dbname]
        collection = db["inventory"]

        query_resp=collection.delete_one({'_id': ObjectId(inventory_id)})

        print(query_resp)

        # Return a success message or any relevant response
        return jsonify({'message': 'Inventory item deleted successfully'}), 200
    except Exception as e:
        # Return an error message if an exception occurs
        return jsonify({'error': str(e)}), 500
    

# Search items by name
@app.route('/api/items/search', methods=['GET'])
def search_items():
    query = request.args.get('name', '').strip()
    dbname = request.args.get('dbname', '').strip()

    if query:

        # If the database name is not provided, return an error
        if not dbname:
                return jsonify({'error': 'Database name not provided in query parameter'}), 400

            # Retrieve all items from the inventory collection in the specified database
        db = client[dbname]
        collection_name = "inventory"  # Variable for the collection name
        items_collection = db[collection_name]  # Use the variable for the collection

        items_by_name = items_collection.find({"name": {"$regex": query, "$options": "i"}})
        formatted_items = []
        for item in items_by_name:
            item['_id'] = str(item['_id'])  # Convert _id to string
            formatted_items.append(item)

    else:
        formatted_items = []


    return jsonify(formatted_items)

# Search items by barcode
@app.route('/api/items/search/barcode', methods=['GET'])
def search_items_by_barcode():
    query = request.args.get('barcode', '').strip()
    dbname = request.args.get('dbname', '').strip()

    if query:

        query=int(query)

        if not dbname:
            return jsonify({'error': 'Database name not provided in query parameter'}), 400

        db = client[dbname]
        collection_name = "inventory"  # Replace with your collection name
        items_collection = db[collection_name]

        # Use $in operator to search for documents where the barcode list contains the queried barcode
        item_by_barcode = items_collection.find_one({"barcodes": {"$in": [query]}})

        print("searching by barcode")

        if item_by_barcode:

            item_by_barcode["_id"]=str(item_by_barcode["_id"])

            item_by_barcode["matching_barcode"]=query

            item_by_barcode.pop("barcodes")

            formatted_items=[item_by_barcode]


        else:
            formatted_items=[]

    else:
        formatted_items=[]


    return jsonify(formatted_items)

@app.route('/api/get-logged-user', methods=['POST'])
def get_logged_user():
    try:
        # Get dbname and sessioncookie from request body
        data = request.get_json()
        dbname = data.get('dbname')
        sessioncookie = data.get('sessioncookie')
        
        # Use dbname and sessioncookie to retrieve the logged-in user from MongoDB
        user = get_logged_user_from_db(dbname, sessioncookie)

        
        # Return the user data
        return jsonify(user), 200
    except Exception as e:
        print('Error getting logged-in user:', e)
        return jsonify({'error': 'Internal server error'}), 500
    
# Function to retrieve user from MongoDB
def get_logged_user_from_db(dbname, sessioncookie):
    # Connect to the appropriate database
    db = client[dbname]

    # Assuming your user collection is named 'users'
    users_collection = db.users

    # Query the user based on sessioncookie
    user = users_collection.find_one({'sessionID': sessioncookie})
    if user:
        user.pop("password")
        user["_id"]=str(user["_id"])

    # Return the user data
    return user


@app.route('/api/get-item', methods=['POST'])
def get_item():
    try:
        # Get dbname and itemId from request data
        data = request.get_json()

        dbname = data.get('dbname')
        itemId = data.get('itemId')
        
        # Connect to the appropriate database
        db = client[dbname]

        # Assuming your item collection is named 'items'
        items_collection = db.inventory

        # Query the item based on itemId
        item = items_collection.find_one({'_id': ObjectId(itemId)})

        item["_id"]=str(item["_id"])

        # Return the item data
        return jsonify(item), 200
    except Exception as e:
        print('Error getting item:', e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/edit-inventory', methods=['POST'])
def edit_inventory():
    try:
        data = request.get_json()

        dbname = data.get('dbname')
        itemId = data.get('itemId')
        
        update_data = {}

        # Extract the fields that have been supplied
        if 'name' in data:
            update_data['name'] = data['name']
        if 'category' in data:
            update_data['category'] = data['category']
        if 'price' in data:
            update_data['price'] = data['price']
        if 'status' in data:
            update_data['status'] = data['status']
        if 'fileData' in data:
            update_data['image'] = data['fileData']

        db = client[dbname]

        # Assuming your item collection is named 'inventory'
        items_collection = db.inventory

        # Update the item in the database
        result = items_collection.update_one(
            {'_id': ObjectId(itemId)},
            {'$set': update_data}
        )

        print(result)

        if result.modified_count == 1:
            return jsonify({'success': True, 'message': 'Inventory modified'}), 200
        else:
            return jsonify({'error': 'Failed to edit item'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-barcodes', methods=['POST'])
def get_barcodes():
    # Get the data sent from the client
    data = request.json
    dbname=data.get("dbname")
    
    # Assuming the data contains dbname and inventoryId
    inventory_id = data.get('inventoryId')

    db = client[dbname]

        # Assuming your item collection is named 'inventory'
    items_collection = db.inventory
    
    # Query MongoDB to find the inventory with the given inventoryId
    inventory = items_collection.find_one({'_id': ObjectId(inventory_id)})
    
    # Check if inventory exists
    if inventory:
        # Retrieve the list of barcodes from the inventory

        barcode_data={}

        barcodes = inventory.get('barcodes', [])

        for barcode in barcodes:

            barcode_info=db.barcode_dates.find_one({'barcode':barcode})

            if barcode_info:

                barcode_info["_id"]=str(barcode_info["_id"])
            else:
                barcode_info={}

            barcode_data.update({barcode:barcode_info})

        # Return the list of barcodes as a JSON response
        return jsonify({'barcodes': barcode_data})
    else:
        return jsonify({'error': 'Inventory not found for given ID'}), 404


@app.route('/api/add-barcode', methods=['POST'])
def add_barcode():
    try:
        # Parse JSON data from request
        data = request.get_json()
        # Extract data
        dbname = data.get('dbname')
        inventory_id = data.get('inventory_id_')
        barcode = data.get('barcode')

        if barcode:
            barcode=int(barcode)

        # Connect to the specific database
        db = client[dbname]
        inventory_collection = db['inventory'] 

        item_by_barcode = inventory_collection.find_one({"barcodes": {"$in": [barcode]}})

        if item_by_barcode:
            response = {
                'status': 'success',
                'message': 'This barcode already exists!'
            }

            return jsonify(response), 200
        
        # Find the inventory item by ID and update it with the new barcode
        result = inventory_collection.update_one(
            {'_id': ObjectId(inventory_id)},
            {'$push': {'barcodes': barcode}}
        )


        if result.matched_count == 1:
            response = {
                'status': 'success',
                'message': 'Barcode added successfully!'
            }

            existing_stock=inventory_collection.find_one({'_id': ObjectId(inventory_id)})

            new_stock=existing_stock["stock"]+1

            inventory_collection.update_one({'_id': ObjectId(inventory_id)},{"$set":{"stock":new_stock}})


            barcode_dates_collection = db['barcode_dates']

            existing_barcode = barcode_dates_collection.find_one({'barcode': barcode})

            if existing_barcode:
                
                # Barcode exists in barcode_dates collection, update the date
                barcode_dates_collection.update_one(
                    {'barcode': barcode},
                    {'$set': {'date_added': datetime.datetime.now()}}
                )
                response.update({"barcode_date_updated":True})
               
            else:
                # Barcode doesn't exist in barcode_dates collection, insert a new document
                barcode_dates_collection.insert_one({'barcode': barcode, 'date_added': datetime.datetime.now()})
                response.update({"barcode_date_added":True})

            inserted_barcode = inventory_collection.find_one({"barcodes": {"$in": [barcode]}})
    
            # Check if barcode exists
            if inserted_barcode:
           
                barcode_data={}

                barcode_info=db.barcode_dates.find_one({'barcode':barcode})

                if barcode_info:

                    barcode_info["_id"]=str(barcode_info["_id"])
                else:
                    barcode_info={}

                barcode_data.update({"barcode":barcode_info})

                response.update({"barcodes":barcode_data})
            

        else:
            response = {
                'status': 'error',
                'message': 'Inventory ID not found.'
            }
        
        return jsonify(response), 200
    except Exception as e:
        response = {
            'status': 'error',
            'message': str(e)
        }
        return jsonify(response), 500

if __name__ == "__main__":
    port=5000

    print(colored(f"[ {datetime.datetime.now()} ] Server started on port {port} ","green"))

    app.run(host="0.0.0.0",port=port)
