import React, { useState, useEffect } from "react";
import axios from "axios";
import { MdDelete } from "react-icons/md";
import { TiEdit } from "react-icons/ti";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from 'sweetalert2';


const App = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [users, setUsers] = useState([]); // Initialize as an empty array
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [isValidEmail, setIsValidEmail] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8040/api/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]); // Handle error case by setting users to an empty array
    }
  };

  const notifySuccess = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const notifyError = (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const validateEmail = (value) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(value);
  };

  const handleCreateUser = async () => {
    try {
      const newUser = { name, email, age: parseInt(age) };

      if (!name || !email || !age) {
        notifyError("All fields are required!");
        return;
      }

      if (parseInt(age) <= 18) {
        notifyError("Age must be above 18!");
        return;
      }

      if (!validateEmail(email)) {
        notifyError("Please enter a valid email address!");
        return;
      }

      // Ensure users array is not null or undefined before checking
      if (!Array.isArray(users)) {
        setUsers([]);
      }

      // Check if email already exists
      const emailExists = users.some((user) => user.email === email);
      if (emailExists) {
        notifyError("Email already exists!");
        return;
      }

      const response = await axios.post(
        "http://localhost:8040/api/users",
        newUser
      );

      if (response.status === 201) {
        setName("");
        setEmail("");
        setAge("");
        notifySuccess("User created successfully!");
        fetchUsers(); // Fetch updated user list after creating new user
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        notifyError("User already exists!");
      } else {
        notifyError("Failed to create user.");
      }
      console.error("Error creating user:", error);
    }
  };

  const handleUpdateUser = async (id) => {
    try {
      const currentUser = users.find((user) => user.id === id);

      const updatedUser = {
        name: name || currentUser.name,
        age: age ? parseInt(age) : currentUser.age,
        email: email || currentUser.email,
      };

      if (!updatedUser.name || !updatedUser.email || !updatedUser.age) {
        notifyError("All fields are required!");
        return;
      }

      if (updatedUser.age <= 18) {
        notifyError("Age must be above 18!");
        return;
      }

      if (!validateEmail(updatedUser.email)) {
        notifyError("Please enter a valid email address!");
        return;
      }

      const emailExists = users.some(
        (user) => user.id !== id && user.email === updatedUser.email
      );
      if (emailExists) {
        notifyError("Email already exists!");
        return;
      }

      if (
        updatedUser.name === currentUser.name &&
        updatedUser.age === currentUser.age &&
        updatedUser.email === currentUser.email
      ) {
        notifySuccess("No changes detected!");
        return;
      }

      const response = await axios.put(
        `http://localhost:8040/api/users/${id}`,
        updatedUser
      );

      if (response.status === 200) {
        fetchUsers(); // Fetch updated user list after updating user
        setIsEditing(false);
        setCurrentId(null);
        setName("");
        setEmail("");
        setAge("");
        notifySuccess("User updated successfully!");
      } else {
        notifyError("Failed to update user.");
      }
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      notifyError("Failed to update user.");
    }
  };

  const handleDeleteUser = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this user!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:8040/api/users/${id}`);
          setUsers(users.filter((user) => user.id !== id));
          notifySuccess('User deleted successfully!');
        } catch (error) {
          console.error(`Error deleting user with ID ${id}:`, error);
          notifyError('Failed to delete user.');
        }
      }
    });
  };
  

  const handleEditUser = (user) => {
    setName(user.name);
    setEmail(user.email);
    setAge(user.age.toString());
    setIsEditing(true);
    setCurrentId(user.id);
  };

  const handleEmailChange = (e) => {
    const { value } = e.target;
    setEmail(value);
    setIsValidEmail(validateEmail(value));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-center text-3xl font-bold text-[#ff9a17] mb-8">
        USER MANAGEMENT
      </h1>

      <div className="flex flex-col items-center gap-4 bg-orange-200 p-6 rounded-lg shadow-lg mb-8">
        <input
          placeholder="Name"
          className="p-2 rounded-md border border-gray-300 focus:outline-none focus:border-[#24A19C]"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Age"
          className="p-2 rounded-md border border-gray-300 focus:outline-none focus:border-[#24A19C]"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <input
          placeholder="Email"
          className={`p-2 rounded-md border ${
            isValidEmail ? "border-gray-300" : "border-red-500"
          } focus:outline-none focus:border-[#24A19C]`}
          type="email"
          value={email}
          onChange={handleEmailChange}
          required
        />
        {!isValidEmail && (
          <p className="text-red-500 mt-1">
            Please enter a valid email address.
          </p>
        )}
        <div className="flex">
          <button
            className="bg-[#24A19C] text-white p-3 rounded-md shadow-md hover:bg-[#1b8a83] transition duration-300 ease-in-out"
            onClick={isEditing ? () => handleUpdateUser(currentId) : handleCreateUser}
          >
            {isEditing ? "Update" : "Add User"}
          </button>
          {isEditing && (
            <button
              className="bg-gray-400 text-white p-3 rounded-md shadow-md hover:bg-gray-600 transition duration-300 ease-in-out ml-2"
              onClick={() => {
                setIsEditing(false);
                setCurrentId(null);
                setName("");
                setEmail("");
                setAge("");
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4">User List</h2>
        {users && users.length > 0 ? (
          users.map((user) => (
            <div
              key={user.id}
              className="w-full bg-white rounded-lg shadow-lg p-4 mb-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#24A19C]">Name</p>
                  <p>{user.name}</p>
                </div>
                <div>
                  <p className="font-bold text-[#24A19C]">Age</p>
                  <p>{user.age}</p>
                </div>
                <div>
                  <p className="font-bold text-[#24A19C]">Email</p>
                  <p>{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-yellow-500 text-white p-2 rounded-md shadow-md hover:bg-yellow-600 transition duration-300 ease-in-out"
                    onClick={() => handleEditUser(user)}
                  >
                    <TiEdit className="inline-block mr-1" />
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white p-2 rounded-md shadow-md hover:bg-red-600 transition duration-300 ease-in-out"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <MdDelete className="inline-block mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No users found.</p>
        )}
      </div>

      <ToastContainer />
    </div>
  );
};

export default App;
