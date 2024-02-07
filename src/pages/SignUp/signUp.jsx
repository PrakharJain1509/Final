import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './signUp.css';
import { createUserWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import pushUidToMainDB from '../../config/Functions/pushUidToMainDB';
import getTokenFromEmail from '../../config/Functions/getTokenFromEmail';
import getUserFromEmail from '../../config/Functions/getUserFromEmail';
import getUserGroups from '../../config/Functions/userGroups';
import googleLogo from "../../google.png";
import rvcLogo from "../../rvclogo.png";




const collegeChoices = [
    { value: 'RVCE', label: 'R.V. College of Engineering' },
    { value: 'RVU', label: 'R.V. University' },
]

const SignUp = ({ switchToDashboard }) => {
    const navigate = useNavigate();
    const [selectedChoice, setSelectedChoice] = useState('');
    const [selectedCollege, setSelectedCollege] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');

    const handleFirstNameChange = (event) => {
        setFirstName(event.target.value);
    };

    const handleBioCHange = (event) => {
        setBio(event.target.value);
    }

    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
    };

    const handleLastNameChange = (event) => {
        setLastName(event.target.value);
    };

    const handleChoiceChange = (event) => {
        setSelectedChoice(event.target.value);
    };

    const handleCollegeChange = (event) => {
        setSelectedCollege(event.target.value);
    };


    const [user, setUser] = useState('');

    const signInWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        setUser(result.user);
    }

    async function fetchSignUpData(username, firstName, lastName, user) {
        try {
            // Make sure to use 'await' for the fetch call
            const userCreationResponse = await fetch(`https://p8u4dzxbx2uzapo8hev0ldeut0xcdm.pythonanywhere.com/users/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "username": username,
                    "email": auth.currentUser.email,
                    "first_name": firstName,
                    "last_name": lastName,
                    "password": user.uid
                }),
            });

            // Make sure to await the result of getUserFromEmail
            const response = await getUserFromEmail(auth.currentUser.email);

            localStorage.setItem('signUpUserDetails', JSON.stringify(response));

            // Check if the userCreationResponse is okay before proceeding
            if (userCreationResponse.ok) {
                await getTokenFromEmail(auth.currentUser.email, auth.currentUser.uid);
                await pushUidToMainDB(auth.currentUser.email, auth.currentUser.uid, selectedChoice, selectedCollege, bio, auth.currentUser.photoURL);
                await getUserGroups();
                switchToDashboard();
            } else {
                console.error('Failed to create user:', userCreationResponse);
            }

        } catch (error) {
            console.error("An error occurred:", error);
        }
    }


    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log(auth.currentUser);

        try {
            await fetchSignUpData(username, firstName, lastName, user);

            // let userDetailsResponse = await getUserFromEmail(auth.currentUser.email);
            // localStorage.setItem('userDetails', JSON.stringify(userDetailsResponse));

            navigate('/');
        } catch (error) {
            console.error("An error occurred during submission:", error);
        }
    };

    const form = (
        <div className="mainForm">

            <div className="collegeChoice">
                <form>
<label>
                        <select value={selectedCollege} className="select1" onChange={handleCollegeChange} >
                            <option value="" disabled>
                                Select College
                            </option>
                            {collegeChoices.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
</label>
                </form>
            </div>

            <form onSubmit={handleSubmit}>

                    <input type="text" value={username} className="input1" onChange={handleUsernameChange} placeholder="Username" />

                    <input type="text" value={firstName} className="input1" onChange={handleFirstNameChange} placeholder="First Name:"/>

                    <input type="text" value={lastName} className="input1" onChange={handleLastNameChange} placeholder="Last Name:" />

                    <textarea type="text" value={bio} className="textarea1" onChange={handleBioCHange} placeholder="Bio:" />

                <br />
                <button onClick={handleSubmit} type="submit" className="button3">Submit</button>

            </form>
        </div>
    )

    const signInWithGoogleButton = (
        <button onClick={signInWithGoogle} className="button2">
            <img
                src={googleLogo}
                className="google-logo"
                />
            <b>Sign Up with Google</b></button>
    )

    return (
        <>
            <div className="signup-container">
            <img src={rvcLogo} className="rvc-logo"/>
            {user === '' ? (
                signInWithGoogleButton
            ) : (
                form
            )}
            </div>
        </>
    );
};

export default SignUp;