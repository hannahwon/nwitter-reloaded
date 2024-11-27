import { styled } from "styled-components";
import { ITweet } from "./timeline";
import { auth, db, storage } from "../routes/firebase";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useState } from "react";
import { TextArea } from "./post-tweet-form";

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 5fr 1fr;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 15px;
`;

const Column = styled.div`
  &:last-child {
    place-self: end;
  }
`;

const Photo = styled.img`
  margin: 20px 20px 20px 20px;
  width: 120px;
  height: 120px;
  border-radius: 15px;
`;

const Username = styled.span`
  font-weight: 600;
  font-size: 15px;
`;

const Payload = styled.p`
  margin: 10px 0px;
  font-size: 18px;
`;

const DeleteButton = styled.button`
  background-color: tomato;
  color: white;
  font-weight: 600;
  border: 0;
  font-size: 12px;
  padding: 5px 10px;
  text-transform: uppercase;
  border-radius: 5px;
  cursor: pointer;
`;

const ChangePhotoInput = styled.input`
  width: 100%;
  height: 100%;
`;

const EditButton = styled.button`
  background-color: #1b9dcf;
  color: white;
  font-weight: 600;
  border: 0;
  font-size: 12px;
  padding: 5px 10px;
  text-transform: uppercase;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 5px;
  margin-right: 5px;
`;

export default function Tweet({ username, photo, tweet, userId, id }: ITweet) {
  const [editMode, setEditMode] = useState(false);
  const [editTweet, setEditTweet] = useState(tweet);
  const [file, setFile] = useState<File |null>(null);
  
  const user = auth.currentUser;
  
  //삭제
  const onDelete = async() => {
    const ok = confirm("Are you sure you want to delete this tweet?");
    if(!ok || user?.uid !== userId) return;
    try {
      await deleteDoc(doc(db, "tweets", id));
      if(photo){
        const photoRef = ref(storage, `tweets/${user.uid}/${id}`);
        await deleteObject(photoRef);
      }
    } catch (error) {
      console.log(error);
    } finally {
      //
    }
  };

  //수정
  const onEdit = async () => {
    setEditMode((prev) => !prev);
    if(!editMode || user?.uid !== userId) return;
    try{
      if(file !== null){
        //기존 이미지 삭제
        const photoRef = ref(storage, `tweets/${user.uid}/${id}`);
        await deleteObject(photoRef);
        //새 이미지 트윗 업데이트
        const locationRef = ref(storage, `tweets/${user.uid}/${id}`);
        const result = await uploadBytes(locationRef, file);
        const imgUrl = await getDownloadURL(result.ref);
        updateDoc(doc(db, "tweets", id), {
          tweet: editTweet,
          imgUrl, 
        });
      }else {
        //트윗만 업데이트
        updateDoc(doc(db, "tweets", id), {
          tweet: editTweet,
        });
      }
    }catch (error){
      console.log(error);
    }finally {
      setEditMode(false);
      setFile(null);
    }
  };

  const onChangeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const {
      target: { value },
    } = e;
    setEditTweet(value);
  }

  const onChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if(files && files.length === 1) {
      if(files[0].size > 1000000){
        e.target.value = "";
        return alert("Photo size too big! \n you can upload under 1MB");
      }
      setFile(files[0]);
    }
  };

      
 
  return (
    <Wrapper>
      <Column>
        <Username>{username}</Username>
        {editMode ? (<TextArea onChange={onChangeText} value={editTweet}></TextArea>) : (<Payload>{tweet}</Payload>)}
        {user?.uid === userId ? (<><EditButton onClick={onEdit}>{editMode ? "save" : "edit"}</EditButton>
          <DeleteButton onClick={onDelete}>Delete</DeleteButton></>) : null }
      </Column>
      <Column>
      {editMode ? (<ChangePhotoInput onChange={onChangeFile} id="file" accept="image/*" type="file"/>) : (photo && <Photo src={photo}/>)}
      </Column>
    </Wrapper>
  );
}
