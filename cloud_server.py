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
from bson.json_util import dumps
from datetime import timedelta
import random
import string
import logging
import colorlog

# Configure colored logging
log_colors_config = {
    'DEBUG': 'cyan',
    'INFO': 'green',
    'WARNING': 'yellow',
    'ERROR': 'red',
    'CRITICAL': 'bold_red'
}

formatter = colorlog.ColoredFormatter(
    "%(log_color)s%(asctime)s - %(levelname)s - %(message)s",
    log_colors=log_colors_config
)

handler = logging.StreamHandler()
handler.setFormatter(formatter)

logger = logging.getLogger()
logger.addHandler(handler)
logger.setLevel(logging.INFO)


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
            logging.error(f"Failed to get location for IP {ip}. Status code: {response.status_code}")
            return None
    except Exception as e:
        # If an exception occurs, print the error message and return None
        logging.error(f"An error occurred: {e}")
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

        logging.error(f"Failed to add user '{fullname} email {email}'. User already exists. IP: {ip} at {datetime.datetime.now()}")
        return jsonify({"error": f"User with this email already exists in {organization}"}), 400

    # If username and email are unique, proceed to add the user
    if email and password:
        # Hash the password before storing it
        hashed_password = generate_password_hash(password)

        if data.get("isAddedByexistinguser",False):
            is_online=False
        else:
            is_online=True



        collection.insert_one({
            "fullname": fullname,
            "organization": organization,
            "email": email,
            "is_admin": is_admin,
            "password": hashed_password,  # Store the hashed password in the database
            "sessionID":sessionID,
            "accepted_terms":accepted_terms,
            "ip": ip,  # Log the IP address
            "joined_date":datetime.datetime.now(),
            "last_login":datetime.datetime.now(),
            "login_location": get_location_by_ip(ip),
            "bio":"",
            "is_online":is_online
        })

        logging.info(f"User '{fullname}' added successfully. IP: {ip} at {datetime.datetime.now()}")
    

        return jsonify({"message": "User added successfully","sessionID":sessionID,"status":"success"}), 200
    else:
        logging.error(f"Invalid request to add user. IP: {ip} at {datetime.datetime.now()}")
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
            logging.info(f"User '{email}' logged in successfully. IP: {ip} at {datetime.datetime.now()}")

            collection.update_one({"email": email}, {"$set": {"last_login": datetime.datetime.now(), "login_location": get_location_by_ip(ip), "ip": ip,"is_online":True}})

            return jsonify({"success": True, "message": "Login successful", "email": user["email"],"sessionID":user["sessionID"],"org":user["organization"],"remember_me":remember}), 200
        else:
            # Password is incorrect, return error message with status code 401
            logging.error(f"Invalid password for user '{email}'. IP: {ip} at {datetime.datetime.now()}")
            return jsonify({"success": False, "message": "Invalid username or password"}), 401
    else:
        # User not found, return error message with status code 404
        logging.error(f"User '{email}' not found. IP: {ip} at {datetime.datetime.now()}")
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
            collection.update_one({"email": user["email"]}, {"$set": {"last_login": datetime.datetime.now(), "login_location": get_location_by_ip(ip), "ip": ip,"is_online":True}})

            return jsonify({'status': 'success', 'message': 'User verified'}),200
        else:
            return jsonify({'status': 'error', 'message': 'User not found'}),404

    except Exception as e:
        logging.error(e)
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

        barcode_quantity = data.get("barcodeQuantity", 0)  # Get the barcode quantity, default to 0 if not present
        item_barcode = data.get("itemBarcode", "")  # Get the item barcode

        if barcode_quantity and item_barcode:
            for _ in range(0, int(barcode_quantity)):
                data["barcodes"].append(int(item_barcode))
        else:
            logging.warning("Either barcode quantity or item barcode is missing")


        data["sales_count"]=0

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
            data["stock"]=len(data["barcodes"])
            data["date_created"]=datetime.datetime.now()

            item_result = collection.insert_one(data)

            barcode_dates_collection = db['barcode_dates']

            for barcode in data["barcodes"]:
            
                barcode_dates_collection.insert_one({'barcode': barcode, 'date_added': datetime.datetime.now()})


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
        logging.error(e)
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

        barcodes=collection.find({'_id':ObjectId(inventory_id)}) # remove all barcodes associated to the inventory

        for barcode in barcodes:
           
            db.barcodes_date.delete_one({'barcode': barcode})
            

        query_resp=collection.delete_one({'_id': ObjectId(inventory_id)})

        logging.info(query_resp)

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

    if not dbname:
        return jsonify({'error': 'Database name not provided in query parameter'}), 400

    db = client[dbname]
    collection_name = "inventory"  # Replace with your collection name
    items_collection = db[collection_name]

    formatted_items = []

    if query:
        try:
            query = int(query)
            # Use $in operator to search for documents where the barcode list contains the queried barcode
            item_by_barcode = items_collection.find_one({"barcodes": {"$in": [query]}})
            logging.info("Searching by barcode")

            if item_by_barcode:
                item_by_barcode["_id"] = str(item_by_barcode["_id"])
                item_by_barcode["matching_barcode"] = query
                item_by_barcode.pop("barcodes", None)
                formatted_items = [item_by_barcode]
        except ValueError:
            # If the query is not an integer, it will not be found in barcodes, so we skip this part
            pass

        if not formatted_items:
            # If no items are found by barcode, search by item name
            try:
                items_by_name = items_collection.find({"name": {"$regex": query, "$options": "i"}})
                for item in items_by_name:
                    item['_id'] = str(item['_id'])  # Convert _id to string
                    formatted_items.append(item)
            except Exception as e:
                logging.error(e)

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
        logging.error('Error getting logged-in user:%s', e)
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
        logging.error(f'Error getting item: {e}')
        return jsonify({'error': 'Internal server error'}), 500



@app.route('/api/get-item/<item_id>', methods=['GET'])
def get_item_two(item_id):
    try:
        dbname = request.args.get('dbname')
        if not dbname:
            return jsonify({'error': 'Missing "dbname" parameter'}), 400

        db = client[dbname]
        items_collection = db.inventory

        item = items_collection.find_one({"_id": ObjectId(item_id)})
        if not item:
            return jsonify({'error': 'Item not found'}), 404

        # Remove ObjectId from the item to avoid serialization issues
        item['_id'] = str(item['_id'])

        return jsonify({'success': True, 'data': item}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


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
        items_collection = db.inventory
        barcode_dates_collection = db['barcode_dates']

        existing_item = items_collection.find_one({"_id": ObjectId(itemId)})
        if not existing_item:
            return jsonify({'error': 'Item not found'}), 404

        # Handle barcode updates
        new_barcodes = data.get('barcodes', [])
        barcode_quantity = data.get("barcodeQuantity", 0)  # Get the barcode quantity, default to 0 if not present
        item_barcode = data.get("itemBarcode", "")  # Get the item barcode

        if barcode_quantity and item_barcode:
            for _ in range(int(barcode_quantity)):
                new_barcodes.append(int(item_barcode))

        if new_barcodes:
            update_data['barcodes'] = existing_item.get('barcodes', []) + new_barcodes
            update_data['stock'] = len(update_data['barcodes'])

            for barcode in new_barcodes:
                barcode_dates_collection.insert_one({'barcode': barcode, 'date_added': datetime.datetime.now()})

        # Update the item in the database
        result = items_collection.update_one(
            {'_id': ObjectId(itemId)},
            {'$set': update_data}
        )

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

        for e,barcode in enumerate(barcodes):

            barcode_info=db.barcode_dates.find_one({'barcode':barcode})

            if barcode_info:

                barcode_info["_id"]=str(barcode_info["_id"])
            else:
                barcode_info={}

            barcode_data.update({f"{barcode}-{e}":barcode_info})

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

        # if item_by_barcode:
        #     response = {
        #         'status': 'success',
        #         'message': 'This barcode already exists!'
        #     }

        #     return jsonify(response), 200
        
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


def pull_one_barcode(inventory_collection,inventoryid, barcode):
    # Find the inventory document
    inventory = inventory_collection.find_one({'_id': ObjectId(inventoryid)})
    
    if not inventory:
        logging.warning(f"No inventory found with id: {inventoryid}")
        return
    
    # Get the barcodes list
    barcodes = inventory.get('barcodes', [])

    if barcode in barcodes:
        # Remove the first occurrence of the barcode
        barcodes.remove(barcode)
        
        # Update the document with the new barcodes list
        result = inventory_collection.update_one(
            {'_id': ObjectId(inventoryid)},
            {'$set': {'barcodes': barcodes}}
        )
        
        if result.modified_count > 0:
            logging.info(f"Successfully removed one instance of barcode {barcode}")

            return 200
        else:
            logging.warning(f"Failed to update the inventory with id: {inventoryid}")
            return 400
    else:
        logging.info(f"Barcode {barcode} not found in the inventory with id: {inventoryid}")

        return 400


@app.route('/api/delete-inventory-barcode', methods=['POST'])
def delete_inventory_barcode():
    try:
        # Extract data from the request
        data = request.get_json()
        dbname = data['dbname']
        inventoryid = data['inventoryid']
        barcode = data['barcode']

        # Access the appropriate database and collection
        db = client[dbname]
        inventory_collection = db['inventory']  # Replace 'inventory' with your collection name

        # Find the document by its _id (which is the inventoryid)
        # result = inventory_collection.update_one(
        #     {'_id': ObjectId(inventoryid)},
        #      {'$pull': {'barcodes': barcode}}
        # )
        result=pull_one_barcode(inventory_collection,ObjectId(inventoryid),barcode)

        if result == 200:

            inventory_collection.update_one(
                {'_id': ObjectId(inventoryid)},
                {'$inc': {'stock': -1}}
            )

            db.barcodes_date.delete_one({'barcode': barcode})
      
            return jsonify({'message': 'Barcode removed successfully'}), 200
        
        else:
            return jsonify({'message': 'Barcode not found or not in the Inventory list'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Endpoint to update email
@app.route('/api-updateEmail', methods=['POST'])
def update_email():
    data = request.get_json()
    logging.info(data)
    new_email = data.get('newEmail')
    email_password = data.get('emailPassword')
    user_id = data.get('user_id')
    db_name = data.get('db_name')

    db = client[db_name]  
    users_collection = db['users']  

    # Check if the user exists and the password is correct
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if user:
        hashed_password = user.get('password')

        if check_password_hash(hashed_password,email_password):
            # Password is correct, update email
            users_collection.update_one({'_id': ObjectId(user_id)}, {'$set': {'email': new_email}})
            return jsonify({'success': True, 'message': 'Email updated successfully'})
        else:
            return jsonify({'success': False, 'message': 'Incorrect password'})
    else:
        return jsonify({'success': False, 'message': 'User not found'})
    
# Endpoint to update password
@app.route('/api-updatePassword', methods=['POST'])
def update_password():
    data = request.json
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')
    user_id = data.get('user_id')
    db_name = data.get('db_name')

    db = client[db_name]  
    users_collection = db['users']

    # Check if the user exists and the current password is correct
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if user:
        hashed_password = user.get('password')
        if check_password_hash(hashed_password, current_password):
            # Password is correct, update password
            new_hashed_password = generate_password_hash(new_password)
            users_collection.update_one({'_id': ObjectId(user_id)}, {'$set': {'password': new_hashed_password}})
            return jsonify({'success': True, 'message': 'Password updated successfully'})
        else:
            return jsonify({'success': False, 'message': 'Incorrect current password'})
    else:
        return jsonify({'success': False, 'message': 'User not found'})
    
@app.route('/api/updatePersonalInfo', methods=['POST'])
def update_personal_info():
    # Get the data from the request
    data = request.json
    
    # Extract data from the request
    full_name = data.get('fullName')
    bio = data.get('bio')
    user_id = data.get('user_id')
    db_name = data.get('db_name')

    db = client[db_name]  
    collection = db['users']
    
    # Update the user's information in the database
    try:
        # Update the user's information
        if bio:
            collection.update_one({'_id': ObjectId(user_id)}, {'$set': {'bio': bio}})
        if full_name:
            collection.update_one({'_id': ObjectId(user_id)}, {'$set': {'fullname': full_name}})

        return jsonify({'message': 'Personal information updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/getUsers', methods=['GET'])
def get_users():
    db_name = request.args.get('dbname')  # Get the dbname from query parameters
    if not db_name:
        return jsonify({'error': 'Database name is required'}), 400
    
    try:
        db = client[db_name]
        users = db.users.find()
        users_list = list(users)  # Convert the cursor to a list
        users_list.reverse()
        
        # Remove the password field for each user
        for user in users_list:
            user.pop('password', None)
        
        return dumps(users_list), 200  # Use bson.json_util.dumps to convert BSON to JSON
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/deleteUser', methods=['POST'])
def delete_user():
    try:
        data = request.get_json()
        user_id = data.get('userId')
        db_name = data.get('dbname')

        if not user_id or not db_name:
            return jsonify({"error": "Missing userId or dbname"}), 400

        # Access the specific database
        db = client[db_name]
        users_collection = db.users

        # Delete the user
        result = users_collection.delete_one({'_id': ObjectId(user_id)})

        if result.deleted_count == 1:
            return jsonify({"message": "User deleted successfully"}), 200
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/api/editUser', methods=['POST'])
def edit_user():
    try:
        # Get the form data from the request
        form_data = request.json

        # Extract data from the form
        dbName = form_data.get('dbName')
        userId = form_data.get('userId')
        fullName = form_data.get('fullName')
        email = form_data.get('email')
        isAdmin = form_data.get('isAdmin')
        isOnline = form_data.get('isOnline')

        # Connect to the MongoDB database
        db = client[dbName]

        # Construct the update fields based on non-empty values
        update_fields = {}
        if fullName:
            update_fields['fullname'] = fullName
        if email:
            update_fields['email'] = email
        if isAdmin is not None:
            if isAdmin:
                isAdmin="Yes"
            else:
                isAdmin="No"

            update_fields['is_admin'] = isAdmin
        if isOnline is not None:
            update_fields['is_online'] = isOnline

        # Update the user in MongoDB with non-empty fields
        db.users.update_one({'_id': ObjectId(userId)}, {'$set': update_fields})

        # Return a success response
        return jsonify({'message': 'User updated successfully'}), 200
    except Exception as e:
        # Return an error response if something goes wrong
        return jsonify({'error': str(e)}), 500
    

def get_week_range(weeks_ago):
    """Return the start and end datetime of the current or previous week based on weeks_ago."""
    now = datetime.datetime.now()
    start_of_week = now - timedelta(days=now.weekday() + 7 * weeks_ago)
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_week = start_of_week + timedelta(days=7)
    return start_of_week, end_of_week

def calculate_revenue_data(sales_collection):
    current_start, current_end = get_week_range(0)
    prev_start, prev_end = get_week_range(1)

    # Current week data
    current_sales = list(sales_collection.find({"timestamp": {"$gte": current_start, "$lt": current_end}}))

    current_revenue = sum(sale['purchase_amount'] for sale in current_sales)

    # Previous week data
    prev_sales = list(sales_collection.find({"timestamp": {"$gte": prev_start, "$lt": prev_end}}))
    prev_revenue = sum(sale['purchase_amount'] for sale in prev_sales)

    # Extracting data for the current and previous weeks by day
    current_week_data = [0] * 7
    previous_week_data = [0] * 7

    for sale in current_sales:
        day_of_week = (sale['timestamp'].date() - current_start.date()).days
        if 0 <= day_of_week < 7:  # Ensure the day_of_week is within bounds
            current_week_data[day_of_week] += sale['purchase_amount']

    for sale in prev_sales:
        day_of_week = (sale['timestamp'].date() - prev_start.date()).days
    
        if 0 <= day_of_week < 7:  # Ensure the day_of_week is within bounds
            previous_week_data[day_of_week] += sale['purchase_amount']

    # Calculate today's earnings
    today_start = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    today_sales = list(sales_collection.find({"timestamp": {"$gte": today_start, "$lt": today_end}}))
    today_earnings = sum(sale['purchase_amount'] for sale in today_sales)

    return {
        "currentWeek": current_week_data,
        "previousWeek": previous_week_data,
        "categories": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "current_revenue": current_revenue,
        "prev_revenue": prev_revenue,
        "today_earnings": today_earnings
    }


def get_month_range(year, month):
    """Return the start and end datetime of a specific month."""
    start_date = datetime.datetime(year, month, 1)
    if month == 12:
        end_date = datetime.datetime(year + 1, 1, 1)
    else:
        end_date = datetime.datetime(year, month + 1, 1)
    return start_date, end_date

def calculate_high_performing_data(sales_collection):
    now = datetime.datetime.now()
    year = now.year
    actual_data = []
    
    for month in range(1, 13):
        start_date, end_date = get_month_range(year, month)
        monthly_sales = list(sales_collection.find({"timestamp": {"$gte": start_date, "$lt": end_date}}))
        monthly_revenue = sum(sale['purchase_amount'] for sale in monthly_sales)
        actual_data.append(monthly_revenue)

    return {
        "actualData": actual_data,
        "categories": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    }

@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    current_start, current_end = get_month_range(datetime.datetime.now().year, datetime.datetime.now().month)
    prev_start, prev_end = get_month_range(datetime.datetime.now().year, datetime.datetime.now().month - 1)

    dbname = request.args.get('dbname')
    if not dbname:
        return jsonify({"error": "Missing dbname parameter"}), 400

    db = client[dbname]
    
    sales_collection = db['sales']
    customers_collection = db['customers']
    inventory_collection = db['inventory']

    # Inventory count for the current month
    inventory_count = inventory_collection.count_documents({})
    
    current_inventory_count = inventory_collection.count_documents({"date_created": {"$gte": current_start, "$lt": current_end}})
    
    # Inventory count for the previous month
    prev_inventory_count = inventory_collection.count_documents({"date_created": {"$gte": prev_start, "$lt": prev_end}})

    # Calculate high-performing data
    high_performing_data = calculate_high_performing_data(sales_collection)

    # Calculate revenue data for the current and previous weeks
    revenue_data = calculate_revenue_data(sales_collection)

    # Current month data
    current_customers_count = customers_collection.count_documents({"timestamp": {"$gte": current_start, "$lt": current_end}})
    current_sales = list(sales_collection.find({"timestamp": {"$gte": current_start, "$lt": current_end}}))
    current_revenue = sum(sale['purchase_amount'] for sale in current_sales)

    # Previous month data
    prev_customers_count = customers_collection.count_documents({"timestamp": {"$gte": prev_start, "$lt": prev_end}})
    prev_sales = list(sales_collection.find({"timestamp": {"$gte": prev_start, "$lt": prev_end}}))
    prev_revenue = sum(sale['purchase_amount'] for sale in prev_sales)

    # Calculations
    customer_growth = ((current_customers_count - prev_customers_count) / prev_customers_count * 100) if prev_customers_count else 0
    revenue_growth = ((current_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue else 0
    purchase_growth = ((len(current_sales) - len(prev_sales)) / len(prev_sales) * 100) if prev_sales else 0
    inventory_growth = ((current_inventory_count - prev_inventory_count) / prev_inventory_count * 100) if prev_inventory_count else 0

    # Overall growth percentage
    growth_percentage = (customer_growth + revenue_growth + purchase_growth + inventory_growth) / 4

    # Construct response
    data = {
        "customers": current_customers_count,
        "customer_growth": round(customer_growth, 2),
        "revenue": current_revenue,
        "revenue_growth": round(revenue_growth, 2),
        "purchases": len(current_sales),
        "inventory_count": inventory_count,
        "inventory_growth": round(inventory_growth, 2),
        "purchase_growth": round(purchase_growth, 2),
        "growth_percentage": round(growth_percentage, 2),
        "highPerformingData": high_performing_data,
        "revenueData": revenue_data
    }
    
    return jsonify(data)


@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    dbname = request.args.get('dbname')
    if not dbname:
        return jsonify({"error": "Missing dbname parameter"}), 400

    db = client[dbname]
    inventory_collection = db["inventory"]

    inventory_data = inventory_collection.find()
    result = []

    for item in inventory_data:
        price = item.get('price', 0)
        sales_count = item.get('sales_count', 0)

        result.append({
            'id': str(item['_id']),
            'name': item['name'],
            'date': item.get('date_created', ''),  
            'price': price,
            'quantity': sales_count,
            'stock_quantity':item.get("stock"),
            'amount': float(price) * sales_count,
            'image':item.get("image")
        })
     # Sort the result by sales_count in descending order and take the top 5
    top_selling_products = sorted(result, key=lambda x: x['quantity'], reverse=True)[:5]

    return jsonify(top_selling_products)


def generate_reference_number():
    # Get the current timestamp
    timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')

    # Generate a random alphanumeric string of 6 characters
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    # Combine timestamp and random string to form the reference number
    reference_number = f"{timestamp}-{random_str}"

    return reference_number

@app.route('/api/checkout', methods=['POST'])
def checkout():
    data = request.get_json()

    dbname = data.get('dbname')
    purchase_amount = data.get('purchase_amount')
    payment_method = data.get('payment_method')
    change_due = data.get('change_due', 0)
    customer_cart_barcode = data.get('customer_cart_barcode')  # Extract the customerCartBarcode data
    sales_person=data.get('sales_person')

    if not dbname or not purchase_amount or not payment_method or not customer_cart_barcode:
        return jsonify({"success": False, "error": "Missing required parameters"}), 400

    db = client[dbname]
    sales_collection = db['sales']
    customers_collection = db['customers']
    inventory_collection = db['inventory']  # Assuming you have an inventory collection

    # Insert new customer document and get the generated customer ID
    customer_id = customers_collection.insert_one({"timestamp": datetime.datetime.now()}).inserted_id

     # Ensure each item in customer_cart_barcode has barcodes
    for item_id, barcodes in customer_cart_barcode.items():

        if not barcodes or "undefined" in barcodes:
            logging.warning("No barcodes detected")
            item = inventory_collection.find_one({'_id': ObjectId(item_id)}, {'barcodes': 1})
            if item and 'barcodes' in item and item['barcodes']:
                quantity_needed = len(barcodes) if barcodes else 1
                available_barcodes = item['barcodes']
                # Sample the required number of barcodes
                customer_cart_barcode[item_id] = random.sample(available_barcodes, min(quantity_needed, len(available_barcodes)))



    # Insert the sale document
    sale = {
        "item_ids":list(customer_cart_barcode.keys()),
        "customer_id": customer_id,
        "purchase_amount": purchase_amount,
        "payment_method": payment_method,
        "change_due": change_due,
        "timestamp": datetime.datetime.now(),
        "items": customer_cart_barcode , # Save the items and barcodes sold
        "sales_person":sales_person,
        "reference_number":generate_reference_number()
    }

    sales_collection.insert_one(sale)
    

    # Update the inventory
    for item_id, barcodes in customer_cart_barcode.items():
        for barcode in barcodes:
            # Fetch the current document
            item = inventory_collection.find_one({"_id": ObjectId(item_id)})
            
            if item and "barcodes" in item and barcode in item["barcodes"]:
                # Remove the barcode from the barcodes list
                updated_barcodes = item["barcodes"]
                updated_barcodes.remove(barcode)
                
                # Update the document with the new barcodes array
                result = inventory_collection.update_one(
                    {"_id": ObjectId(item_id)},
                    {"$set": {"barcodes": updated_barcodes}}
                )
                
                if result.modified_count > 0:
                    # Update stock and sales count
                    inventory_collection.update_one(
                        {"_id": ObjectId(item_id)},
                        {"$inc": {"stock": -1, "sales_count": 1}}
                    )
                    
                    updated_item = inventory_collection.find_one({"_id": ObjectId(item_id)})
                    if not updated_item["barcodes"]:
                        # Remove the barcode from barcodes_date collection
                        db.barcodes_date.delete_one({"barcode": barcode})

    return jsonify({"success": True, "customer_id": str(customer_id)})


@app.route('/api/sales-data', methods=['GET'])
def get_sales_data():
    dbname = request.args.get('dbname')
    if not dbname:
        return jsonify({'error': 'Missing dbname'}), 400

    db = client[dbname]
    sales_collection = db['sales']
    inventory_collection = db['inventory']
    

    sales_data = list(sales_collection.find())
    for sale in sales_data:
        sale['_id'] = str(sale['_id'])
        sale['customer_id'] = str(sale['customer_id'])
        # Add item names and categories
        item_details = []

        try:
            checkout_quantity=0

            for item_id in sale['item_ids']:
                item = inventory_collection.find_one({'_id': ObjectId(item_id)}, {'name': 1, 'category': 1})
                if item:
                
                    item['_id'] = str(item['_id'])
                    # Calculate the quantity of each item
                    item_quantity = len(sale['items'][item_id])
                    
                    checkout_quantity+=item_quantity

                    item_details.append(item)

        except Exception as e:
            logging.error(f"Failed to get {e} for {sale.get('_id')}")
        
        sale["quantity"]=checkout_quantity
        sale['item_details'] = item_details
        sale['store_id']=dbname
        sale['payment_status']="paid"

    return jsonify(sales_data)

@app.route('/api-dailySales', methods=['POST'])
def get_daily_sales():
    try:
        # Get the request data (user_id and db_name)
        data = request.get_json()
        user_id = data.get('user_id')
        db_name = data.get('db_name')

        # Connect to the user's specific database
        db = client[db_name]
        sales_collection = db['sales']

        # Logging the action
        logging.info(f"Calculating daily sales for user: {user_id} on database: {db_name}")

        # Calculate today's sales
        today_start = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        # Fetch today's sales from the 'sales' collection
        today_sales = list(sales_collection.find({"timestamp": {"$gte": today_start, "$lt": today_end}}))

        # Calculate total sales and profits
        daily_sales = sum(sale['purchase_amount'] for sale in today_sales)
        daily_profits = sum(sale['purchase_amount'] * 0.25 for sale in today_sales)  # Assuming 25% profit margin

        # Calculate growth from yesterday
        yesterday_start = today_start - timedelta(days=1)
        yesterday_end = today_start

        yesterday_sales = list(sales_collection.find({"timestamp": {"$gte": yesterday_start, "$lt": yesterday_end}}))
        yesterday_sales_total = sum(sale['purchase_amount'] for sale in yesterday_sales)

        growth = 0
        if yesterday_sales_total > 0:
            growth = ((daily_sales - yesterday_sales_total) / yesterday_sales_total) * 100

        # Logging the result
        logging.info(f"Daily sales: {daily_sales}, Profits: {daily_profits}, Growth: {growth}%")

        # Return the result as JSON
        return jsonify({
            'sales': daily_sales,
            'profits': daily_profits,
            'growth': growth
        }), 200

    except Exception as e:
        logging.error(f"Error calculating daily sales: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500



@app.route('/api-monthlyYearlyProfits', methods=['POST'])
def get_monthly_yearly_profits():
    data = request.get_json()
    user_id = data.get('user_id')
    db_name = data.get('db_name')

    # Use db_name and user_id to fetch user-specific data
    db = client[db_name]
    sales_collection = db['sales']

    # Current date and time
    now = datetime.datetime.now()

    # Calculate the start of the current month and year
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    first_day_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    # Get the sales for the current month
    monthly_sales = list(sales_collection.find({"timestamp": {"$gte": first_day_of_month}}))
    monthly_profits = sum(sale['purchase_amount'] * 0.25 for sale in monthly_sales)
    monthly_revenue = sum(sale['purchase_amount'] for sale in monthly_sales)
    monthly_units_sold = sum(len(sale['items'][item_id]) for sale in monthly_sales for item_id in sale['items'])  # Count the total number of items sold

    # Get the sales for the current year
    yearly_sales = list(sales_collection.find({"timestamp": {"$gte": first_day_of_year}}))
    yearly_profits = sum(sale['purchase_amount'] * 0.25 for sale in yearly_sales)
    yearly_revenue = sum(sale['purchase_amount'] for sale in yearly_sales)
    yearly_units_sold = sum(len(sale['items'][item_id]) for sale in yearly_sales for item_id in sale['items'])  # Count the total number of items sold

    # Get the sales for the previous month (for growth comparison)
    previous_month_end = first_day_of_month - timedelta(seconds=1)
    first_day_of_previous_month = previous_month_end.replace(day=1)
    previous_month_sales = list(sales_collection.find({"timestamp": {"$gte": first_day_of_previous_month, "$lt": first_day_of_month}}))
    previous_month_profits = sum(sale['purchase_amount'] * 0.25 for sale in previous_month_sales)

    # Get the sales for the previous year (for growth comparison)
    previous_year_sales = list(sales_collection.find({"timestamp": {"$gte": now.replace(year=now.year-1, month=1, day=1), "$lt": first_day_of_year}}))
    previous_year_profits = sum(sale['purchase_amount'] * 0.25 for sale in previous_year_sales)

    # Calculate growth rates
    monthly_growth = ((monthly_profits - previous_month_profits) / previous_month_profits * 100) if previous_month_profits else 0
    yearly_growth = ((yearly_profits - previous_year_profits) / previous_year_profits * 100) if previous_year_profits else 0

    # Return the data as JSON
    return jsonify({
        'monthly_profits': round(monthly_profits, 2),
        'monthly_revenue': round(monthly_revenue, 2),
        'monthly_units_sold': monthly_units_sold,
        'monthly_growth': round(monthly_growth, 2),
        'yearly_profits': round(yearly_profits, 2),
        'yearly_revenue': round(yearly_revenue, 2),
        'yearly_units_sold': yearly_units_sold,
        'yearly_growth': round(yearly_growth, 2)
    })



    
@app.route('/api/logout', methods=['POST'])
def logout():
    # Get user ID from request data
    user_id = request.json.get('user_id')
    db_name=request.json.get('db_name')

    db = client[db_name]
    db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'is_online': False}})

    return jsonify({'message': 'User logged out successfully'}), 200

if __name__ == "__main__":
    port=5000

    logging.info(f"[ {datetime.datetime.now()} ] Server started on port {port} ")

    app.run(host="0.0.0.0",port=port)
