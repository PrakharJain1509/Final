import React, {useEffect, useRef, useState} from 'react';
import { addDoc, collection, serverTimestamp, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { redirect, useNavigate } from 'react-router-dom';
import { differenceInMinutes } from 'date-fns';
import CrossIcon from '../cross.png';
import menuIcon from '../menuicon.png';
import groupicon from '../groupicon.png';
import lockicon from '../lockicon.png';
import profileicon from '../profileicon.png'
import TickIcon from '../tickicon.png';

import getUserGroups from "../config/Functions/userGroups";
import axios from "axios";

const ChatApp = ({switchToProfilePage,switchTochatApp}) => {
    // const navigate = useNavigate();

    const groupId = localStorage.getItem('groupIDofCurrentGroup');
    const [newMessage, setMessage] = useState('');
    const [messages, setMessages] = useState([]); // Fix variable name
    const bottomRef = useRef(null);
    const [dataList, setDataList] = useState([]);
    const [showchatRoomMenu, setshowchatRoomMenu] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [searchQuerychatroom, setSearchQuerychatroom] = useState('');
    const [groupName, setGroupName] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showAddUserDropdown, setShowAddUserDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);



    useEffect(() => {
        const fetchGroupName = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`https://p8u4dzxbx2uzapo8hev0ldeut0xcdm.pythonanywhere.com/groups/${groupId}/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setGroupName(data.name);
                    setSelectedGroup(data); // Set the selectedGroup state
                } else {
                    console.error('Error fetching group name');
                }
            } catch (error) {
                console.error('Error fetching group name', error);
            }
        };

        fetchGroupName();
    }, [groupId]);


    const messagesRef = collection(db, 'messages');

    useEffect(() => {
        console.log('Group ID:', groupId);

        if (!groupId) {
            return; // Exit early if groupId is not available
        }

        const queryMessage = query(
            messagesRef,
            where('groupId', '==', groupId),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(queryMessage, (snapshot) => {
            let messagesArray = [];
            snapshot.forEach((doc) => {
                messagesArray.push({ ...doc.data(), id: doc.id });
            });
            setMessages(messagesArray);
        });

        return () => {
            unsubscribe();
        };
    }, [groupId]); // Include 'groupId' in the dependency array to re-run the effect when it changes


    let user = localStorage.getItem('userDetails');
    let userData = JSON.parse(user);

    const leaveChatRoom = () => {
        localStorage.removeItem('groupIDofCurrentGroup');
        switchToProfilePage()
        // navigate('/chatRoom');
    }


    const handleSubmit = async (event) => {
        event.preventDefault();
        if (newMessage === '') return;

        await addDoc(messagesRef, {
            text: newMessage,
            createdAt: serverTimestamp(),
            sender: auth.currentUser.displayName,
            groupId: groupId
        });
        setMessage('');
    }

    const scrollToBottom = () => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, );

    //
    // ... (existing code)

    const openChatRoomMenu = () => {
        setshowchatRoomMenu((prevValue) => !prevValue);
    };
    const closeChatRoomMenu = (group) => {
        // setGroupPicture(selectedGroup.picture);
        // setGroupName(selectedGroup.name);
        setshowchatRoomMenu(false);

    };

    const filteredUsers = selectedGroup && selectedGroup.members
        ? selectedGroup.members.filter((user) => {
            // console.log('Filtered User:', user);
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
            return fullName.includes(searchQuerychatroom.toLowerCase());
        })
        : [];

    useEffect(() => {
        if (selectedGroup && selectedGroup.id) {
            loadGroupMembers(selectedGroup.id);
        }
    }, [selectedGroup]);

    const [loadedMembers, setLoadedMembers] = useState([]);

    const fetchProfilePicture = async (username) => {
        try {
            const profilePicResponse = await axios.get(`https://p8u4dzxbx2uzapo8hev0ldeut0xcdm.pythonanywhere.com/profile-pics/by-username/${username}/`);
            const profile_picture = profilePicResponse.data.profile_picture;
            // console.log(`Profile picture for ${username}:`, profile_picture);
            return profile_picture;
        } catch (error) {
            console.error(`Error fetching profile picture for ${username}:`, error);
            return null; // Handle error and set default picture
        }
    };



    const loadGroupMembers = async (groupId) => {
        try {
            // Fetch the token from local storage
            const token = localStorage.getItem('token');

            // Make sure the token is available before making the request
            if (!token) {
                console.error('Token not found in local storage');
                return [];
            }

            // Include the token in the request headers
            const headers = {
                Authorization: `Token ${token}`,
            };

            // Make the request with the headers
            const response = await axios.get(`https://p8u4dzxbx2uzapo8hev0ldeut0xcdm.pythonanywhere.com/groups/${groupId}/`, {
                headers,
            });

            const groupData = response.data;

            // Assuming groupData.members is an array of members
            const members = groupData.members || [];

            // Fetch profile pictures for each member
            const fetchMemberProfilePictures = async (members) => {
                const membersWithProfilePictures = await Promise.all(members.map(async (member) => {
                    const profile_picture = await fetchProfilePicture(member.username);
                    return {
                        ...member,
                        profile_picture,
                    };
                }));
                // console.log('Members with profile pictures:', membersWithProfilePictures);
                setLoadedMembers(membersWithProfilePictures); // Update the state with the loaded members
                return membersWithProfilePictures;
            };


            const updatedMembers = await fetchMemberProfilePictures(members);

            // Return the members to the calling function
            return updatedMembers;
        } catch (error) {
            console.error('Error fetching group members:', error);
            throw error; // Rethrow the error to handle it in the calling function
        }
    };

    const updateGroupDetails = async () => {
        try {
            // Your existing logic for updating group details...

            // Add new selected users to the group
            if (selectedUsers.length > 0) {
                const addUsersToGroup = async () => {
                    const token = localStorage.getItem('token');

                    // Prepare an array of promises for each user addition
                    const addUsersPromises = selectedUsers.map(async (selectedUser) => {
                        const data = {
                            user: selectedUser.id, // Assuming user.id is the correct user ID field
                            group: selectedGroup.id, // Assuming selectedGroup.id is the correct group ID field
                        };

                        const response = await axios.post('https://p8u4dzxbx2uzapo8hev0ldeut0xcdm.pythonanywhere.com/memberships/', data, {
                            headers: {
                                Authorization: `Token ${token}`,
                            },
                        });

                        // Return the added user data
                        return response.data;
                    });

                    // Wait for all promises to resolve
                    const addedUsers = await Promise.all(addUsersPromises);

                    // Update the state or perform any other necessary actions
                    console.log('Added users to the group:', addedUsers);
                };

                await addUsersToGroup();
            }

            // Your existing logic...

            console.log('Group details updated successfully!');
        } catch (error) {
            console.error('Error updating group details:', error);
        }
        closeAddUserDropdown();
    };

    const handlesearchQuerychatroom = (e) => {
        setSearchQuerychatroom(e.target.value);
    };
    useEffect(() => {
        if (searchQuerychatroom.trim().length >= 2 && selectedGroup && selectedGroup.id) {
            setIsSearching(true);

            const cleanedQuery = searchQuerychatroom.trim().toLowerCase().replace(/\s/g, '');

            // Fetch members for the selected group
            loadGroupMembers(selectedGroup.id)
                .then((members) => {
                    // Filter members based on the search query
                    const filteredUsers = members.filter((user) =>
                        user.first_name.toLowerCase().replace(/\s/g, '').includes(cleanedQuery) ||
                        user.last_name.toLowerCase().replace(/\s/g, '').includes(cleanedQuery)
                    );

                    setSearchResults(filteredUsers);
                })
                .catch((error) => {
                    console.error('Error fetching data:',   error);
                })
                .finally(() => {
                    setIsSearching(false);
                });
        } else {
            setSearchResults([]);
            setIsSearching(false); // Make sure to set isSearching to false when no search query.
        }
    }, [searchQuerychatroom, selectedGroup]);


// prakhar
    const openAddUserDropdown = () => {
        setShowAddUserDropdown(true);
        setSearchQuery('');
        setSelectedUsers([]);
    };

    const closeAddUserDropdown = () => {
        setShowAddUserDropdown(false);
        setSearchQuery('');
        setSelectedUsers([]);
    };



    useEffect(() => {
        if (searchQuery.trim().length >= 2) {
            setIsLoading(true);

            const cleanedQuery = searchQuery.trim().toLowerCase().replace(/\s/g, '');

            axios.get(`https://p8u4dzxbx2uzapo8hev0ldeut0xcdm.pythonanywhere.com/users/`)
                .then(async (response) => {
                    const filteredUsers = response.data.filter((user) =>
                        user.username.toLowerCase().replace(/\s/g, '').includes(cleanedQuery) ||
                        user.first_name.toLowerCase().replace(/\s/g, '').includes(cleanedQuery) ||
                        user.last_name.toLowerCase().replace(/\s/g, '').includes(cleanedQuery)
                    );

                    // Fetch profile pictures for each user in the filtered results
                    const fetchProfilePictures = async (users) => {
                        const usersWithProfilePictures = await Promise.all(users.map(async (user) => {
                            const profile_picture = await fetchProfilePicture(user.username);
                            return {
                                ...user,
                                profile_picture,
                            };
                        }));
                        setSearchResults(usersWithProfilePictures);
                        setIsLoading(false);
                    };

                    fetchProfilePictures(filteredUsers); // Call the function to fetch profile pictures
                })
                .catch((error) => {
                    console.error('Error fetching data:', error);
                    setIsLoading(false);
                });
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);



    const toggleUserSelection = (user) => {
        // const userid = localStorage.getItem('id');
        if (!selectedGroup || !selectedGroup.members || !user) {
            return;
        }

        const isAlreadySelected = selectedUsers && selectedUsers.some((selectedUser) => selectedUser.id === user.id);

        if (!isAlreadySelected) {
            setSelectedUsers([...selectedUsers, user]);
        } else {
            const updatedUsers = selectedUsers.filter((selectedUser) => selectedUser.id !== user.id); // Fix here, use user.id instead of userid
            setSelectedUsers(updatedUsers);
        }
        // Other conditions or handling based on your use case
    };


    const formatMatchingText = (text, query) => {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.split(regex).map((part, index) =>
            regex.test(part) ? <b key={index}>{part}</b> : part
        );
    };
    const handleInputChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
    };
// prakhar


    return (
        <div className="chat-app">
            <div style={{ position: 'fixed',backgroundColor: '#fff', left:'0px',top:'0px',width:'100%',borderBottom:'1px solid #ccc',zIndex:'1000'}}>
                <button onClick={leaveChatRoom} style={{ border: 'none', background: 'transparent', position: 'absolute', top: '30px', left: '0px' }}>
                    <img src={CrossIcon} style={{ height: '15px', width: '15px' }} />
                </button>
                {/* Group picture and name */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '10px',marginLeft:'30px', }}>
                    {/* Replace selectedGroup.picture with the actual image */}
                    <img src={groupicon} style={{ height: '50px', width: '50px', borderRadius: '50%' ,boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.9)'}} />
                    <p style={{fontFamily: 'Helvetica', marginLeft: '10px',width: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',fontSize:'20px' }}><b>{groupName}</b></p>
                </div>
                <button onClick={openChatRoomMenu} style={{ border: 'none', background: 'transparent', position: 'absolute', top: '25px', right: '15px' }}>
                    <img src={menuIcon}  style={{ height: '30px', width: '30px' }} />
                </button>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '140px',}}>
                <div style={{ textAlign: 'center', color: '#000',backgroundColor:'#f0f0f0',borderRadius:'10px',padding:'15px',fontFamily: 'Helvetica',fontSize:'18px',position:'absolute' }}>
                    <img src={lockicon} style={{ width: '18px', height: '18px', marginRight: '5px' }} />
                    Messages are end to end encrypted.
                </div>
            </div>
            {messages.map((message) => (
                <div key={message.id} style={{
                    position:'relative',
                    fontFamily: 'Helvetica',
                    top:'40px',
                    marginTop: '10px',
                    borderRadius: '10px',
                    padding:'10px',
                    clear: 'both',
                    overflow: 'hidden',
                    marginLeft: message.sender === '' ? 'auto' : '0',
                    marginRight: message.sender === '' ? '0' : 'auto',
                    wordWrap: 'break-word',
                    fontSize: '18px',
                    whiteSpace: 'pre-line',
                    backgroundColor: message.sender === 'system' ? '#f0f0f0' : (message.sender === '' ? '#f0f0f0' : '#85ff9a'),
                    maxWidth:message.sender === 'system' ?'100%':'70%',
                    marginBottom: '8px',
                    color: '#000',
                }}>
                    <b>{message.sender}</b> <br/><br/> {message.text}<br/>
                    {message.createdAt && (
                        <span style={{ fontSize: '12px', color: '#484848', marginTop: '3px', fontFamily: 'Helvetica',float:'right' }}>{message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    <div ref={bottomRef} />
                </div>
            ))}
            <form onSubmit={handleSubmit} action="" className='new-message-form'
                  style={{marginTop:'150px',}}

            >
                <div style={{ position: 'fixed', bottom: '-5px',left:'-10px',    height: `${55 + (Math.min(6, newMessage.split('\n').length + 1) - 1) * 20}px`,
                    width: '100%', backgroundColor: '#fff', padding: '10px',boxShadow: '0px 3px 9px rgba(0, 0, 0, 1)',borderRadius:'25px' }}>
                <textarea type="text" className='new-message-input' placeholder='Message...' onChange={(e) => setMessage(e.target.value)} value={newMessage}
                          rows={Math.min(6, newMessage.split('\n').length + 1)}
                          style={{position:'fixed',bottom:'15px', width: 'calc(100% - 120px)', padding: '8px',borderRadius: '25px' ,height:'auto',fontSize:'18px',resize:'none',marginLeft:'5px',paddingRight:'100px',}}
                />
                    <button type='submit' className='send-button'
                            style={{
                                right: '30px',
                                position: 'fixed',
                                bottom:'15px',
                                padding: '18px 10px',
                                background: 'transparent',
                                color: '#000',
                                border: 'none',
                                fontFamily: 'Helvetica',
                                fontSize: '22px',
                            }}
                    ><b>Send</b></button>
                </div>
            </form>

            {showchatRoomMenu && (

                <div

                    style={{overflowY:'scroll',position: 'fixed', bottom: -1, left: 0, height:'99%',width: '100%', backgroundColor: 'white',  zIndex: '1000',borderTopRightRadius:'20px',borderTopLeftRadius:'20px', border:'0px solid #000',boxShadow: '0px 3px 9px rgba(0, 0, 0, 1)'}}>
                    <input
                        type="text"
                        placeholder="Enter group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        style={{boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.9)',
                            marginBottom: '15px',
                            position:'relative',
                            left: '50%',
                            top: '15%',
                            transform: 'translate(-50%, -50%)',
                            paddingLeft: '18px',
                            fontFamily: 'Helvetica',
                            width: 'calc(90% - 25px)',
                            height: '40px',
                            background: 'rgba(255, 255, 255, 0.5)',
                            border: '1px solid #ccc',
                            fontSize: '18px',
                            zIndex: '1',
                            borderRadius: '11px',}}
                    />

                    <button
                        // onClick={updateGroupDetails}
                        style={{float:'right',  position:'absolute', right: '15px', top:'10px',boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.9)',color:'#fff', fontFamily: 'Helvetica', width: '100px', height: '40px',background:'#000',border:'1px solid #ccc',fontSize:'18px',borderRadius: '11px',}}
                    >Save</button>
                    <button onClick={closeChatRoomMenu}
                            style={{border:'none',background:'transparent',position:'absolute',top:'10px',left:'15px'}}>
                        <img src={CrossIcon} style={{position: 'absolute',  height:'15px',width:'15px'}} />
                    </button>
                    <div style={{display:'flex',justifyContent:'space-between',position:'relative',top:'15%'}}>
                        <button onClick={openAddUserDropdown}
                                style={{  marginLeft:'20px',boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.9)',color:'#fff', fontFamily: 'Helvetica', width: '100px', height: '40px',background:'#000',border:'1px solid #ccc',fontSize:'18px',borderRadius: '11px',}}
                        >Add users</button>

                        <button
                            // onClick={deleteGroup}
                            style={{float:'right',border:'none',background:'transparent',color:'#ff4141',fontSize:'18px', fontFamily: 'Helvetica', marginRight:'20px',}}>
                            <b>Delete group</b>
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="Search users"
                        value={searchQuerychatroom}
                        onChange={handlesearchQuerychatroom}
                        style={{
                            position:'relative',
                            paddingLeft: '18px',
                            fontFamily: 'Helvetica',
                            width: 'calc(100% - 22px)',
                            height: '40px',
                            background: '#efefef',
                            border: '1px solid #ccc',
                            fontSize: '20px',
                            borderRadius: '11px',
                            top:'20%',
                        }}
                    />

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-evenly', position: 'relative', top: '25%', left: '0px', gap: '40px', }}>
                        {filteredUsers.map((selectedUser) => (
                            <div key={selectedUser.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <img
                                    src={profileicon} // Replace with the actual image field
                                    style={{ width: '40px', height: '40px', borderRadius: '100%', marginBottom: '5px', border: 'none' }}
                                />

                                <button
                                    // onClick={() => removeUserFromGroup(selectedUser)} // Add your remove function here
                                    style={{ position: 'absolute', top: '0px', right: '0px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                >
                                    <img src={CrossIcon} style={{ height: '12px', width: '12px' }} />
                                </button>

                                {selectedUser.first_name && selectedUser.last_name ? (
                                    <p style={{ fontFamily: 'Helvetica', color: '#8f8f8f', fontSize: '14px', textAlign: 'center', width: '70px' }}>
                                        {selectedUser.first_name} {selectedUser.last_name}
                                    </p>
                                ) : (
                                    <p style={{ fontFamily: 'Helvetica', color: '#8f8f8f', fontSize: '14px', textAlign: 'center', width: '70px' }}>
                                        Unknown User
                                    </p>
                                )}
                            </div>
                        ))}

                    </div>


                    {/*prakhar*/}
                    {showAddUserDropdown && (
                        <div style={{ overflowY: 'scroll', position: 'fixed', bottom: -1, left: 0, height: '99%', width: '100%', backgroundColor: 'white', zIndex: '100', borderTopRightRadius: '20px', borderTopLeftRadius: '20px', border: '0px solid #000', boxShadow: '0px 3px 9px rgba(0, 0, 0, 1)' }}>

                            {/* Display selected users in a horizontal space */}
                            {selectedUsers.length > 0 ? (
                                <div style={{ borderBottom: '1px solid #ccc', padding: '0px 0', position: 'relative', top: '70px', overflowX: 'auto', display: 'flex' }}>
                                    {selectedGroup.members.map((existingUser) => (
                                        <div key={existingUser.id} style={{ flexBasis: '20%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <img
                                                src={existingUser.profile_picture || profileicon} // Use the actual profile picture if available, otherwise fallback to the default
                                                style={{ width: '40px', height: '40px', borderRadius: '100%', marginBottom: '5px', border: 'none' }}
                                            />
                                            <p style={{ fontFamily: 'Helvetica', color: '#8f8f8f', fontSize: '14px', textAlign: 'center', width: '70px' }}>
                                                {`${existingUser.first_name || ''}\n${existingUser.last_name || ''}`}
                                            </p>
                                        </div>
                                    ))}
                                    {selectedUsers.map((selectedUser) => (
                                        <div key={selectedUser.id} style={{ flexBasis: '20%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <img
                                                src={selectedUser.profile_picture || profileicon} // Use the actual profile picture if available, otherwise fallback to the default
                                                style={{ width: '40px', height: '40px', borderRadius: '100%', marginBottom: '5px', border: 'none' }}
                                            />
                                            <button
                                                // onClick={() => removeUserFromGroup(selectedUser)}
                                                style={{ position: 'absolute', top: '0px', right: '0px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                            >
                                                <img src={CrossIcon} style={{ height: '12px', width: '12px' }} />
                                            </button>
                                            <p style={{ fontFamily: 'Helvetica', color: '#8f8f8f', fontSize: '14px', textAlign: 'center', width: '70px' }}>
                                                {`${selectedUser.first_name || ''}\n${selectedUser.last_name || ''}`}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ borderBottom: '1px solid #ccc', padding: '0px 0', position: 'relative', top: '70px', overflowX: 'auto', display: 'flex' }}>
                                    {selectedGroup.members.map((existingUser) => (
                                        <div key={existingUser.id} style={{ flexBasis: '20%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <img
                                                src={existingUser.profile_picture || profileicon} // Use the actual profile picture if available, otherwise fallback to the default
                                                style={{ width: '40px', height: '40px', borderRadius: '100%', marginBottom: '5px', border: 'none' }}
                                            />
                                            <p style={{ fontFamily: 'Helvetica', color: '#8f8f8f', fontSize: '14px', textAlign: 'center', width: '70px' }}>
                                                {`${existingUser.first_name || ''}\n${existingUser.last_name || ''}`}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}


                            <input
                                type="text"
                                placeholder="Search users"
                                value={searchQuery}
                                onChange={handleInputChange}
                                style={{
                                    paddingLeft: '18px',
                                    fontFamily: 'Helvetica',
                                    width: 'calc(100% - 22px)',
                                    height: '40px',
                                    background: '#efefef',
                                    border: '1px solid #ccc',
                                    fontSize: '20px',
                                    borderRadius: '11px',
                                    marginTop: '70px',
                                }}
                            />

                            {/* Display search results */}
                            {isSearching ? (
                                <p>Searching...</p>
                            ) : (
                                searchResults.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => !selectedGroup.members.some((existingUser) => existingUser.id === user.id) && toggleUserSelection(user)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            borderBottom: '1px solid #ccc',
                                            padding: '0px 0',
                                        }}
                                    >
                                        {/* Render user information here */}
                                        <img
                                            src={user.profile_picture || profileicon} // Replace with the actual image field
                                            // alt={user.username} // Add alt text
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                marginRight: '10px',
                                            }}
                                        />
                                        <div
                                            style={{
                                                flex: '1',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <div>
                                                <p
                                                    style={{
                                                        fontFamily: 'Helvetica',
                                                        color: '#000',
                                                        fontSize: '17px',
                                                        position: 'relative',
                                                        top: '4px',
                                                        margin: '10px',
                                                    }}
                                                >
                                                    <b>@{formatMatchingText(user.username, searchQuery)}</b>
                                                </p>
                                                <p
                                                    style={{
                                                        fontFamily: 'Helvetica',
                                                        color: '#8f8f8f',
                                                        position: 'relative',
                                                        top: '-2px',
                                                        fontSize: '17px',
                                                        margin: '10px',
                                                    }}
                                                >
                                                    {formatMatchingText(user.first_name, searchQuery)} {formatMatchingText(user.last_name, searchQuery)}
                                                </p>
                                            </div>
                                            {selectedGroup.members.some((existingUser) => existingUser.id === user.id) ? (
                                                <button disabled style={{ marginRight: '10px', border: 'none', background: 'transparent', fontFamily: 'Helvetica', color: '#8a8a8a', fontSize: '12px' }}>
                                                    <b>(Already added to the bubble)</b>
                                                </button>
                                            ) : (
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleUserSelection(user);
                                                }} style={{ marginRight: '30px', border: 'none', background: 'transparent' }}>
                                                    {selectedUsers.some((selectedUser) => selectedUser.id === user.id) && (
                                                        <img src={TickIcon} style={{ position: 'absolute', height: '20px', width: '20px' }} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}

                            {selectedUsers.length > 0 && (
                                <button
                                    onClick={updateGroupDetails}
                                    style={{border: 'none',background:'transparent',fontSize:'18px',fontFamily:'Helvetica',position:'absolute',top:'10px',right:'15px'}}
                                ><b>Add</b></button>
                            )}
                            <button
                                onClick={closeAddUserDropdown}
                                style={{border:'none',background:'transparent',position:'absolute',top:'10px',left:'15px'}}>
                                <img src={CrossIcon} style={{position: 'absolute',  height:'15px',width:'15px'}} />
                            </button>
                        </div>
                    )}
                    {/*prakhar*/}


                </div>
            )}

        </div>
    )}


export default ChatApp;