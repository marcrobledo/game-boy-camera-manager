/*
* Game Boy Camera Manager
* (last update: 2025-05-30)
* By Marc Robledo https://www.marcrobledo.com
*
* License:
*
* MIT License
* 
* Copyright (c) 2025 Marc Robledo
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/



const CHECKSUM_MAGIC='Magic';

const ALPHABET_EN='\x00あいうえおかぎくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよ、。らりるれろわをん～*がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽっゃゅょ・ゎぃぅぇぉABCDEFGHIJKLMNOPQRSTUVWXYZ_\',.ÁÂÀÄÉÊÈËÍÏÓÖÚÜÑ-&!? abcdefghijklmnopqrstuvwxyz·~\xa4 áâàäéêèëíïóöúüñçß\xb7\xb8\xb90123456789/:˜"@ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ\xe3\xe4\xe5－０１２３４５６７８９／：˜”＠';
const ALPHABET_JP='\x00あいうえおかぎくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよ、。らりるれろわをん～*がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽっゃゅょ・ゎぃぅぇぉアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨ！？ラリルレロワヲンヴ ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポッャュョ‐ァィゥェォＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ_\',.ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ\xe3\xe4\xe5－０１２３４５６７８９／：˜”＠';
const SPECIAL_CHARACTERS=[
	{id:'heart', charCodeEn:0x32, charCodeJp:0x32},
	{id:'phone', charCodeEn:0xa4, charCodeJp:0xe3},
	{id:'happy', charCodeEn:0xb7, charCodeJp:0xe5},
	{id:'sad', charCodeEn:0xb8}, /* sad emote doesn't exist in japanese charset */
	{id:'sweat', charCodeEn:0xb9, charCodeJp:0xe4}
];
const REGEX_SPECIAL_CHARACTERS=/^\[(heart|phone|happy|sad|sweat|[0-9a-fA-F]{2})\]/i;

const PALETTES=[
	[[255, 255, 255], [160, 160, 160], [80, 80, 80], [0, 0, 0]], /* grayscale */
	[[224, 248, 208], [136, 192, 112], [52, 104, 86], [8, 24, 32]], /* emulators */
	[[155, 188, 15], [128, 159, 14], [48, 98, 48], [15, 56, 15]], /* DMG */
	[[255, 239, 206], [222, 148, 74], [173, 41, 33], [49, 25, 82]], /* SGB */
	[[255, 255, 255], [103, 228, 33], [14, 95, 175], [0, 0, 0]] /* GBC */
];














const displayAndThrowError=function(error){
	//to-do: improve UX
	alert(error);
	throw new Error(error);
}

const _=function(str){
	return str; //to-do
}
const _fixString=function(str, maxLen){
	const alphabet=appSettings.regionJapan? ALPHABET_JP : ALPHABET_EN;
	var result='';
	for(var i=0; i<maxLen && str.length; i++){
		const specialCharacter=str.match(REGEX_SPECIAL_CHARACTERS);
		if(specialCharacter){
			if(/[0-9a-fA-F]/.test(specialCharacter[1])){
				result+=specialCharacter[0].toLowerCase();
			}else{
				const knownSpecialCharacter=SPECIAL_CHARACTERS.find(function(specialCharacter2){
					return specialCharacter2.id===specialCharacter[1].toLowerCase();
				});
				if(knownSpecialCharacter)
					result+=specialCharacter[0].toLowerCase();
			}
			str=str.substr(specialCharacter[0].length);
		}else{
			const character=str.charAt(0);
			if(character && alphabet.indexOf(character)>0)
				result+=character;
			str=str.substr(1);
		}
	}
	return result;
};


const _getExportFileName=function(){
	if(currentPicture instanceof PocketCameraFrame){
		const frameIndex=currentROM.frames.indexOf(currentPicture) + 1;
		return 'frame'+frameIndex;
	}else if(currentPicture instanceof PocketCameraFrameWild){
		const frameWildIndex=currentROM.framesWild.indexOf(currentPicture) + 1;
		return 'wild_frame'+frameWildIndex;
	}else if(currentPicture instanceof PocketCameraCartridgeGameFace){
		const GAME_FACE_FILENAMES=[
			'ball1',
			'ball2',
			'dj1',
			'dj2',
			'ball1',
			'ball2',
			'space_fever1',
			'space_fever2'
		];
		return 'game_face_'+GAME_FACE_FILENAMES[currentROM.gameFaces.indexOf(currentPicture)];
	}else if(currentPicture instanceof PocketCameraPicture){
		if(currentROM){
			if(currentPicture.hasMetadata){
				const pictureIndex=currentROM.pictures.indexOf(currentPicture) + 1;
				return 'pictureB'+pictureIndex;
			}else if(currentROM.titleScreens.indexOf(currentPicture) !== -1){
				const titleScreenIndex=currentROM.titleScreens.indexOf(currentPicture) + 1;
				return 'title_screen'+titleScreenIndex;
			}
		}else if(currentSRAM){
			if(currentPicture.hasMetadata){
				const pictureIndex=currentSRAM.album.findPictureAlbumIndex(currentPicture) + 1;
				return 'picture'+pictureIndex;
			}else if(currentPicture === currentSRAM.gameFace){
				return 'game_face';
			}
		}
	}
	return 'picture';
}
const _evtClickExportPicture=function(evt){
	let sliceSize=3584 //normal picture (16*14 * 16);
	if(currentPicture instanceof PocketCameraFrame){
		sliceSize=1672; //96tiles * 16 + 4rows * 20 + 4cols * 14
	}else if(currentPicture instanceof PocketCameraFrameWild){
		sliceSize=5376; //336tiles * 16
	}else if(currentPicture instanceof PocketCameraPicture && currentPicture.hasMetadata){
		sliceSize+=348; //metadata size
	}
	_saveFile(currentPicture.data.slice(0, sliceSize), _getExportFileName()+'.bin');
};
const _evtClickExportImage=function(evt){
	const canvas=currentPicture.toCanvas(2);
	//save canvas as image
	const link=document.createElement('a');
	link.download=_getExportFileName()+'.png';
	link.href=canvas.toDataURL('image/png');
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};
const _evtClickExportImageOriginal=function(evt){
	const canvas=currentPicture.toCanvas(1, true);
	//save canvas as image
	const link=document.createElement('a');
	link.download=_getExportFileName()+'_original.png';
	link.href=canvas.toDataURL('image/png');
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};
const _evtClickImportPicture=function(evt){
	const fileInput=document.createElement('input');
	fileInput.type='file';
	fileInput.accept='.bin,image/png,image/jpeg,image/gif,image/webp';

	fileInput.addEventListener('change', function(evt){
		if(/^image\/(png|jpeg|gif|webp)$/.test(this.files[0].type)){
			const img = new Image();
			if(currentPicture instanceof PocketCameraFrame){
				img.onload = function() {
					importFrame(this);
				};
			}else if(currentPicture instanceof PocketCameraFrameWild){
				img.onload = function() {
					importFrameWild(this);
				};
			}else if(currentPicture instanceof PocketCameraCartridgeGameFace || currentPicture instanceof PocketCameraPicture){
				img.onload = function() {
					importImage(this);
				};
			}
			img.src = window.URL.createObjectURL(this.files[0]);
		}else{
			const fileReader=new FileReader();
			fileReader.onload=function(evt) {
				const fileSize=evt.target.result.byteLength;
				if(currentPicture instanceof PocketCameraFrame && fileSize===1672){
					currentPicture.injectData(evt.target.result);
				}else if(currentPicture instanceof PocketCameraFrameWild && fileSize===5376){
					currentPicture.injectData(evt.target.result);
				}else if(currentPicture instanceof PocketCameraCartridgeGameFace  && fileSize===3584){
					currentPicture.injectData(evt.target.result);
					if(appSettings.regionJapan)
						refreshAlbum('game-faces');
				}else if(currentPicture instanceof PocketCameraPicture  && (fileSize===3584 || fileSize===3932)){
					currentPicture.injectData(evt.target.result);
				}
				_refreshCurrentPicture(true);
			};
			fileReader.readAsArrayBuffer(this.files[0]);
		}
	});

	fileInput.click();
};
const _evtClickEditPicture=function(evt){
	document.getElementById('input-edit-user-id').value=currentPicture.userId;
	document.getElementById('input-edit-user-name').value=currentPicture.userName;
	document.getElementById('select-edit-user-gender').value=currentPicture.userGender;
	document.getElementById('select-edit-user-blood').value=currentPicture.userBloodType;
	document.getElementById('input-edit-birthday-year').value=currentPicture.birthdayYear!=='----'? currentPicture.birthdayYear : '';
	document.getElementById('input-edit-birthday-month').value=currentPicture.birthdayMonth!=='--'? currentPicture.birthdayMonth : '';
	document.getElementById('input-edit-birthday-day').value=currentPicture.birthdayDay!=='--'? currentPicture.birthdayDay : '';
	document.getElementById('textarea-edit-comment').value=currentPicture.comment.replace(/\n+$/g, '');
	document.getElementById('select-edit-border').value=currentPicture.border;

	document.getElementById('dialog-edit').showModal();
};

const _evtClickPicture=function(evt){
	const currentButton=document.querySelector('.album button.selected');
	if(currentButton)
		currentButton.className='';

	this.className='selected';

	const albumPictures=this.albumPictures;
	const pictureIndex=this.albumPictureIndex;

	currentPicture=albumPictures[pictureIndex];
	_refreshCurrentPicture();
	document.querySelector('aside').className='mobile-show';
	document.getElementById('mobile-backdrop').className='mobile-show';
}
const _refreshCurrentPicture=function(updateAlbumButton){
	if(!currentPicture)
		return;

	const canvas = currentPicture.toCanvas(2);
	document.getElementById('canvas-picture').width=canvas.width;
	document.getElementById('canvas-picture').height=canvas.height;
	document.getElementById('canvas-picture').getContext('2d').drawImage(canvas, 0, 0);

	if(currentPicture.hasMetadata){
		document.getElementById('picture-info').children[0].style.display='block';

		const canvasThumbnail = currentPicture.toCanvasThumbnail();
		document.getElementById('canvas-thumbnail').getContext('2d').drawImage(canvasThumbnail, 0, 0);

		if(currentPicture.userName){
			document.getElementById('picture-author').innerHTML=currentPicture.userName+' ';
			document.getElementById('picture-author').innerHTML+='<span class="mono">#'+currentPicture.userId+'</span>';
		}else{
			document.getElementById('picture-author').innerHTML='#'+currentPicture.userId;
		}

		document.getElementById('picture-date').innerHTML=`${currentPicture.birthdayYear}/${currentPicture.birthdayMonth}/${currentPicture.birthdayDay}`;
		document.getElementById('picture-comment').innerHTML=currentPicture.comment.trim().replace(/\n/g, '<br/>');
	}else{
		document.getElementById('picture-info').children[0].style.display='none';

		if(currentROM){
			if(currentROM.frames.indexOf(currentPicture) !== -1){
				const frameIndex=currentROM.frames.indexOf(currentPicture) + 1;
				document.getElementById('picture-author').innerHTML='Frame #'+frameIndex;
			}else if(currentROM.framesWild.indexOf(currentPicture) !== -1){
				const frameIndex=currentROM.framesWild.indexOf(currentPicture) + 1;
				document.getElementById('picture-author').innerHTML='Wild frame #'+frameIndex;
			}else if(currentROM.gameFaces.indexOf(currentPicture) !== -1){
				const ROM_GAME_FACES=appSettings.regionJapan?[
					'Ball 1 / Run! Run! 1', '1?', 'DJ 1', 'DJ 2', '4?', 'Ball 2',
					'Run! Run! 2 / Space Fever 1', 'Space Fever 2'
				]:
				[
					'Ball 1', 'Ball 2', 'DJ 1', 'DJ 2', 'Run! Run! 1', 'Run! Run! 2',
					'Space Fever 1', 'Space Fever 2'
				];
				const faceIndex=currentROM.gameFaces.indexOf(currentPicture);
				document.getElementById('picture-author').innerHTML=ROM_GAME_FACES[faceIndex];
			}else if(currentROM.titleScreens.indexOf(currentPicture) !== -1){
				const titleScreenIndex=currentROM.titleScreens.indexOf(currentPicture) + 1;
				document.getElementById('picture-author').innerHTML='Title screen #'+titleScreenIndex;
			}
		}else if(currentSRAM){
			if(currentSRAM.gameFace === currentPicture){
				document.getElementById('picture-author').innerHTML=_('Game Face');
			}
		}

		document.getElementById('picture-date').innerHTML='';
		document.getElementById('picture-comment').innerHTML='';
	}

	
	document.getElementById('btn-export').disabled=false;
	document.getElementById('btn-import').disabled=false;
	document.getElementById('btn-edit').disabled=!currentPicture.hasMetadata;
	if(currentSRAM && currentSRAM.pictures.indexOf(currentPicture) !== -1){			
		document.getElementById('btn-delete-restore').innerHTML=currentSRAM.album.findPictureAlbumIndex(currentPicture)===-1? _('Restore') : _('Delete');
		document.getElementById('btn-delete-restore').disabled=false;
	}else{
		document.getElementById('btn-delete-restore').disabled=true;
	}

	if(updateAlbumButton){
		let albumId;
		if(currentROM){
			if(currentROM.frames.indexOf(currentPicture) !== -1){
				albumId='frames';
			}else if(currentROM.framesWild.indexOf(currentPicture) !== -1){
				albumId='frames-wild';
			}else if(currentROM.pictures.indexOf(currentPicture) !== -1){
				albumId='b';
			}else if(currentROM.gameFaces.indexOf(currentPicture) !== -1){
				albumId='game-faces';
			}else if(currentROM.titleScreens.indexOf(currentPicture) !== -1){
				albumId='title-screen';
			}
		}else if(currentSRAM){
			if(currentSRAM.pictures.indexOf(currentPicture) !== -1){
				albumId='a';
			}else if(currentSRAM.album.getUnindexed().indexOf(currentSRAM.pictures.indexOf(currentPicture)) !== -1){
				albumId='deleted';
			}else if(currentSRAM.gameFace===currentPicture){
				albumId='game-face';
			}
		}

		if(albumId){
			const albumPictures=getAlbumPictures(albumId);
			const albumPictureIndex=albumPictures.indexOf(currentPicture);
			if(albumPictureIndex!==-1){
				const canvas = currentPicture.toCanvas();
				const pictureButton=document.getElementById('album-'+albumId).children[albumPictureIndex];
				pictureButton.replaceChild(canvas, pictureButton.firstChild);
			}
		}
	}
}
function getAlbumPictures(albumId){
	if(currentROM){
		if(albumId==='b'){
			return currentROM.pictures;
		}else if(albumId==='title-screen'){
			return currentROM.titleScreens;
		}else if(albumId==='frames'){
			return currentROM.frames;
		}else if(albumId==='frames-wild'){
			return currentROM.framesWild;
		}else if(albumId==='game-faces'){
			if(appSettings.regionJapan){
				return [
					currentROM.gameFaces[0],
					currentROM.gameFaces[5],
					currentROM.gameFaces[2],
					currentROM.gameFaces[3],
					currentROM.gameFaces[0],
					currentROM.gameFaces[6],
					currentROM.gameFaces[6],
					currentROM.gameFaces[7]
				];
			}else{
				return currentROM.gameFaces;
			}
		} 
	}else if(currentSRAM){
		if(albumId==='a'){
			return currentSRAM.album.getIndexed().map(function(pictureId){
				return currentSRAM.pictures[pictureId];
			});
		}else if(albumId==='game-face'){
			return [currentSRAM.gameFace];
		}else if(albumId==='deleted'){
			return currentSRAM.album.getUnindexed().map(function(pictureId){
				return currentSRAM.pictures[pictureId];
			});
		}
	}
	return [];
}
function refreshAlbum(albumId){
	const albumContainer=document.getElementById('album-'+albumId);
	albumContainer.innerHTML='';
	const albumPictures=getAlbumPictures(albumId);

	for (var i=0; i<albumPictures.length; i++) {
		const canvas = albumPictures[i].toCanvas();

		const btn=document.createElement('button');
		if(currentPicture===albumPictures[i])
			btn.className='selected';
		btn.appendChild(canvas);
		btn.albumPictures=albumPictures;
		btn.albumPictureIndex=i;
		btn.addEventListener('click', _evtClickPicture);

		albumContainer.appendChild(btn);
	}

	if(albumId==='deleted'){
		albumContainer.previousElementSibling.style.display=albumPictures.length?'block':'none';
	}
}
function buildAlbum(albumId, title){
	const h2=document.createElement('h2');
	h2.innerHTML='<span>'+title+'</span>';
	const albumContainer=document.createElement('div');
	albumContainer.id='album-'+albumId;
	albumContainer.className='album album-'+albumId;
	document.getElementById('albums').appendChild(h2);
	document.getElementById('albums').appendChild(albumContainer);
	refreshAlbum(albumId);
}
function buildAllAlbums(){
	document.getElementById('albums').innerHTML='';
	if(currentROM){
		buildAlbum('frames', _('Frames'));
		buildAlbum('frames-wild', _('Wild frames'));
		buildAlbum('game-faces', _('Game faces'));
		buildAlbum('b', _('B album'));
		buildAlbum('title-screen', _('Title screen'));
	}else if(currentSRAM){
		buildAlbum('a', _('A album'));
		buildAlbum('deleted', _('Deleted'));
		buildAlbum('game-face', _('Game face'));

		const h2=document.createElement('h2');
		h2.innerHTML='<span>'+_('Extras')+'</span>';
		const albumContainer=document.createElement('div');
		albumContainer.id='album-extras';

		
		const labelUserId=document.createElement('label');
		labelUserId.innerHTML=_('Profile ID')+': ';
		const inputUserId=document.createElement('input');
		inputUserId.className='mono';
		inputUserId.type='text';
		inputUserId.placeholder=_('Profile ID');
		inputUserId.size=8;
		inputUserId.maxLength=8;
		const profileData=new PocketCameraData(currentSRAM._arrayBuffer, 0x2fb8, 25);
		inputUserId.value=profileData.readDoubleDigits(0x0000, 4, true);
		
		inputUserId.addEventListener('change', function(evt){
			this.value=this.value.replace(/[^0-9]/g, '').padStart(8, '0').substr(0, 8);
			profileData.writeDoubleDigits(0x0000, 4, this.value, true);
			profileData.recalculateChecksum(0x0000, 23);
		});
		labelUserId.appendChild(inputUserId);
		albumContainer.appendChild(labelUserId);




		const missingCoroCoro=appSettings.regionJapan && !currentSRAM.checkCoroCoroContent();
		const missingFeats=currentSRAM.generalData.getMissingFeats();
		const button=document.createElement('button');
		button.innerHTML=_('Unlock all content');
		button.disabled=!(missingCoroCoro || Object.keys(missingFeats).length);
		button.className='btn';
		button.addEventListener('click', function(evt){
			if(missingCoroCoro)
				currentSRAM.unlockCoroCoroContent();
			if(Object.keys(missingFeats).length)
				currentSRAM.generalData.setData(missingFeats);
			this.disabled=true;
		});
		albumContainer.appendChild(button);
		document.getElementById('albums').appendChild(h2);
		document.getElementById('albums').appendChild(albumContainer);
	}
}


class PocketCameraData{
	constructor(arrayBuffer, offset, len){
		this.data = new Uint8Array(arrayBuffer, offset, len);
	}

	readByte(offset){
		return this.data[offset];
	}
	readBytes(offset, len){
		const bytes=new Array(len);
		for (var i=0; i<len; i++) {
			bytes[i]=this.readByte(offset+i);
		}
		return bytes;
	}
	readDoubleDigits(offset, nBytes, extraDigits){
		const alphabet=extraDigits? '-0123456789?':'0123456789';
		var result='';
		for (var i=0; i<nBytes; i++) {
			const byte=this.readByte(offset+i);
			const leftDigit=Math.max(0, Math.min(alphabet.length, ((byte >> 4) & 0x0f))); //clamp(0,alphabet.length)
			const rightDigit=Math.max(0, Math.min(alphabet.length, (byte & 0x0f))); //clamp(0,alphabet.length)

			if(extraDigits){
				result+=alphabet.charAt(leftDigit) + alphabet.charAt(rightDigit);
			}else{
				result=(alphabet.charAt(leftDigit) + alphabet.charAt(rightDigit)) + result;
			}
		}
		return extraDigits? result : parseInt(result);
	}
	readText(offset, len){
		const alphabet=appSettings.regionJapan? ALPHABET_JP : ALPHABET_EN;

		const bytes=this.readBytes(offset, len);
		var str='';
		for (var i=0; i<bytes.length; i++) {
			const byte=bytes[i];
			const specialCharacter=SPECIAL_CHARACTERS.find(function(specialCharacter){
				return (
					(!appSettings.regionJapan && specialCharacter.charCodeEn===byte) ||
					(appSettings.regionJapan && specialCharacter.charCodeJp===byte)
				)
			});
			if(specialCharacter){
				str+='['+specialCharacter.id+']';
			}else if(byte){
				const character=alphabet.charAt(byte);
				if(character)
					str+=character;
			}

		}
		return str;
	}

	writeByte(offset, byte){
		this.data[offset]=byte;
	}
	writeBytes(offset, bytes){
		for (var i=0; i<bytes.length; i++) {
			this.writeByte(offset+i, bytes[i]);
		}
	}
	writeDoubleDigits(offset, nBytes, val, extraDigits){
		if(extraDigits){
			if(typeof val !== 'string')
				throw new TypeError('val must be a string');

			if(val.length<nBytes*2)
				if(nBytes===4) //userId
					val=val.padStart(nBytes*2, '0');
				else
					val=val.padStart(nBytes*2, '?');

			const alphabet='-0123456789?';

			for (var i=0; i<nBytes; i++) {
				const leftDigit=alphabet.indexOf(val.charAt(i*2));
				const rightDigit=alphabet.indexOf(val.charAt(i*2+1));

				const byte=0x00 | ((leftDigit<alphabet.length? leftDigit : 0) << 4) | (rightDigit<alphabet.length? rightDigit : 0);
				this.writeByte(offset+i, byte);
			}
		}else{
			if(typeof val !== 'number' || val<0)
				throw new TypeError('val must be a positive number');

			for (var i=0; i<nBytes; i++) {
				const rightDigit=(val % 100) % 10;
				const leftDigit=Math.floor((val % 100) / 10);
				val=Math.floor(val / 100);

				const byte=0x00 | (leftDigit << 4) | rightDigit;
				this.writeByte(offset+i, byte);
			}
		}
	}
	writeText(offset, str, maxLen){
		const alphabet=appSettings.regionJapan? ALPHABET_JP : ALPHABET_EN;
		const bytes=new Array(maxLen).fill(0x00);
		var i=0;
		str=str.replace(/[\r\n]/g, ' ');
		while(str.length && i<maxLen){
			const specialCharacter=str.match(REGEX_SPECIAL_CHARACTERS);
			if(specialCharacter){
				if(/^[0-9a-fA-F]{2}$/.test(specialCharacter[1])){
					bytes[i++]=parseInt(specialCharacter[1].toLowerCase(), 16);
				}else{
					const knownSpecialCharacter=SPECIAL_CHARACTERS.find(function(specialCharacter2){
						return specialCharacter2.id===specialCharacter[1].toLowerCase();
					});
					if(knownSpecialCharacter)
						bytes[i++]=appSettings.regionJapan? knownSpecialCharacter.charCodeJp : knownSpecialCharacter.charCodeEn;
				}
				str=str.substr(specialCharacter[0].length);
			}else{
				const characterIndex=alphabet.indexOf(str.charAt(0));
				if(characterIndex>0)
					bytes[i++]=characterIndex;
				str=str.substr(1);
			}
		}
		this.writeBytes(offset, bytes);		
	}

	readTilesData(offsetTile, nTiles, palette){
		const tilesData=new Array(nTiles);
		let readOffset=offsetTile * 16;
		for(var i=0; i<nTiles; i++){

			const tileImageData=new ImageData(8, 8);
			let writeOffset=0;
			for (var j=0; j<8; j++) {
				const byte0=this.data[readOffset++];
				const byte1=this.data[readOffset++];

				for(var k=0; k<8; k++){
					const color = ((byte0 & (0x80 >> k))!=0) + (((byte1 & (0x80 >> k))!=0) * 2);
					
					tileImageData.data[writeOffset++]=palette[color][0];
					tileImageData.data[writeOffset++]=palette[color][1];
					tileImageData.data[writeOffset++]=palette[color][2];
					tileImageData.data[writeOffset++]=255;
				}
			}

			tilesData[i]=tileImageData;
		}
		return tilesData;
	}
	injectData(offset, arrayBuffer){
		const u8array=new Uint8Array(arrayBuffer);
		for(var i=0; i<u8array.length; i++){
			this.data[offset+i]=u8array[i];
		}
	}

	recalculateChecksum(offset, len){
		let sumByte = 0x4e;
		let xorByte = 0x54;
	
		for (let i = 0; i < len; i++) {
			const byte=this.readByte(offset + i);
			sumByte = (sumByte + byte) & 0xff;
			xorByte = xorByte ^ byte;
		}

		this.data[offset + len + 0] = sumByte;
		this.data[offset + len + 1] = xorByte;
		return {
			sumByte,
			xorByte
		};
	}
}

class PocketCameraAlbum extends PocketCameraData{
	constructor(arrayBuffer){
		super(arrayBuffer, 0x11b2, 37);

		this.pictureIndexes=this.readBytes(0x00, 30);

		//this.sumByte=this.readByte(0x23);
		//this.xorByte=this.readByte(0x24);
	}

	getIndexed(){
		const sortedIndexes=[];
		for(var i=0; i<30; i++){
			const pictureIndex=this.pictureIndexes.indexOf(i);
			if(this.pictureIndexes.indexOf(i)!==-1)
				sortedIndexes.push(pictureIndex);
		}
		return sortedIndexes;
	}
	getUnindexed(){
		const indexed=this.getIndexed();
		const unindexed=[];
		for(var i=0; i<30; i++){
			if(indexed.indexOf(i)===-1)
				unindexed.push(i);
		}
		return unindexed;
	}
	getMaxSize(){
		let maxSize=0;
		for(var i=0; i<30; i++){
			const pictureIndex=this.pictureIndexes[i];
			if(pictureIndex!==0xff && pictureIndex>maxSize)
				maxSize=pictureIndex;
		}
	
		return maxSize;
	}
	findPictureAlbumIndex(picture){
		if(picture instanceof PocketCameraPicture){
			const pictureIndex=currentSRAM.pictures.indexOf(picture);
			if(pictureIndex!==-1)
				return this.getIndexed().indexOf(pictureIndex);
		}
		return -1;
	}
	removePicture(albumIndex){
		const pictureIndex=this.pictureIndexes.indexOf(albumIndex);
		/* shift following pictures */
		for(var i=0; i<30; i++){
			if(this.pictureIndexes[i]!==0xff && this.pictureIndexes[i] > albumIndex)
				this.pictureIndexes[i]--;
		}
		this.pictureIndexes[pictureIndex]=0xff;
		this.writeBytes(0x00, this.pictureIndexes);
		this.recalculateChecksum(0x00, 35);
	}
	insertPicture(pictureIndex){
		const maxSize=this.getMaxSize();
		if(maxSize<30){
			this.pictureIndexes[pictureIndex]=maxSize + 1;
			this.writeBytes(0x00, this.pictureIndexes);
			this.recalculateChecksum(0x00, 35);
		}
	}
}


class PocketCameraCartridge{
	constructor(arrayBuffer){
		this._arrayBuffer=arrayBuffer;

		this.pictures = [];
		for(var i=0; i<30; i++){
			const offset=0x0da000 + i*0x1000;
			const picture=new PocketCameraPicture(arrayBuffer, offset);
			this.pictures.push(picture);
		}

		this.titleScreens=[];
		for(var i=0; i<7; i++){
			let offset=0x0f8000 + i*0x0e00;
			if(i>=4){
				offset+=0x800;
			}
			const picture=new PocketCameraPicture(arrayBuffer, offset, true);
			this.titleScreens.push(picture);
		}

		this.frames=[];
		for(var i=0; i<19; i++){
			let offset=0x0d0000 + i*0x0688;
			if(i>=9){
				offset+=0x0538;
			}
			if(i===18){ //B album border
				offset=0x0fb800;
			}
			const frame=new PocketCameraFrame(arrayBuffer, offset);
			this.frames.push(frame);
		}

		this.framesWild=[];
		for(var i=0; i<8; i++){
			let offset=0x0c4000 + i*0x1800;

			const frameWild=new PocketCameraFrameWild(arrayBuffer, offset);
			this.framesWild.push(frameWild);
		}

		this.gameFaces=[
			new PocketCameraCartridgeGameFace(arrayBuffer, 0x03df00), //ball 1
			new PocketCameraCartridgeGameFace(arrayBuffer, 0x0a6e00), //ball 2
			new PocketCameraCartridgeGameFace(arrayBuffer, 0x03ed00), //dj 1
			new PocketCameraCartridgeGameFace(arrayBuffer, 0x03a300), //dj 2
			new PocketCameraCartridgeGameFace(arrayBuffer, 0x0a6000), //run 1
			new PocketCameraCartridgeGameFace(arrayBuffer, 0x03b100), //run 2
			new PocketCameraCartridgeGameFace(arrayBuffer, 0x040e00), //space fever 1
			new PocketCameraCartridgeGameFace(arrayBuffer, 0x040000) //space fever 2
		]
	}

	applyPatch(bank, offset, originalData, patchData){
		if(bank>=2)
			offset+=(bank - 1) * 0x4000;

		const u8array=new Uint8Array(this._arrayBuffer);
		/* check if original data matches */
		for(var i=0; i<originalData.length; i++){
			if(u8array[offset + i] !== originalData[i])
				return false;
		}

		/* apply patch */
		if(patchData){
			for(var i=0; i<patchData.length; i++){
				u8array[offset + i]=patchData[i];
			}
		}
		return true;
	}

	fixGameBoyGlobalChecksum(){
		const data=new Uint8Array(this._arrayBuffer);
		let globalChecksum=0x0000;
		for(var i=0; i<data.length; i++){
			if(i===0x014e || i===0x014f)
				continue; //skip current global checksum
			
			globalChecksum += data[i];
			globalChecksum = globalChecksum & 0xffff;
		}

		data[0x014e]=(globalChecksum >> 8) & 0xff;
		data[0x014f]=globalChecksum & 0xff;
		return globalChecksum;
	}
}
class PocketCameraGeneralData extends PocketCameraData{
	constructor(arrayBuffer){
		super(arrayBuffer, 0x1000, 217);

		/* parse data */
		this.animation={
			slots:this.readBytes(0x0000, 47),
			flag:this.readByte(0x002f),
			loops:this.readBytes(0x0030, 47),
			speed:this.readByte(0x005f),
			border:this.readByte(0x0060)
		};
		this.dj={
			sound0Data:this.readBytes(0x0061, 24),
			sound1Data:this.readBytes(0x0079, 15 + 24),
			loopCounts:this.readByte(0x00a0),
			noiseData:this.readBytes(0x00a1, 22),
			unknownData:this.readBytes(0x00b7, 2),
			tempo:this.readByte(0x00b9)
		},
		this.savedAlready=this.readByte(0x00ba);
		this.picturesTaken=this.readDoubleDigits(0x00bb, 2);
		this.picturesErased=this.readDoubleDigits(0x00bd, 2);
		this.picturesTransfered=this.readDoubleDigits(0x00bf, 2);
		this.picturesPrinted=this.readDoubleDigits(0x00c1, 2);
		this.picturesReceivedMale=this.readDoubleDigits(0x00c3, 1);
		this.picturesReceivedFemale=this.readDoubleDigits(0x00c4, 1);
		this.scoreSpaceFever=this.readDoubleDigits(0x00c5, 4);
		this.scoreBall=this.readDoubleDigits(0x00c9, 2);
		this.scoreRunRunRun=9999 - this.readDoubleDigits(0x00cb, 2);
		//this.unknownData0=this.readBytes(0x00cd, 3);
		this.printingIntensity=this.readByte(0x00d0);
		this.unknownData1=this.readByte(0x00d1);
		//this.magic=this.readString(0x00d2, 5);
		
		//this.sumByte=this.readByte(0x00d7);
		//this.xorByte=this.readByte(0x00d8);
	}
	setData(data){
		if(typeof data !== 'object')
			throw new TypeError('data must be an object');

		if(typeof data.picturesTaken === 'number' && data.picturesTaken>=0 && data.picturesTaken<=9999){
			this.picturesTaken=data.picturesTaken;
			this.writeDoubleDigits(0x00bb, 2, this.picturesTaken);
		}
		if(typeof data.picturesErased === 'number' && data.picturesErased>=0 && data.picturesErased<=9999){
			this.picturesErased=data.picturesErased;
			this.writeDoubleDigits(0x00bd, 2, this.picturesErased);
		}
		if(typeof data.picturesTransfered === 'number' && data.picturesTransfered>=0 && data.picturesTransfered<=9999){
			this.picturesTransfered=data.picturesTransfered;
			this.writeDoubleDigits(0x00bf, 2, this.picturesTransfered);
		}
		if(typeof data.picturesPrinted === 'number' && data.picturesPrinted>=0 && data.picturesPrinted<=9999){
			this.picturesPrinted=data.picturesPrinted;
			this.writeDoubleDigits(0x00c1, 2, this.picturesPrinted);
		}
		if(typeof data.picturesReceivedMale === 'number' && data.picturesReceivedMale>=0 && data.picturesReceivedMale<=99){
			this.picturesReceivedMale=data.picturesReceivedMale;
			this.writeDoubleDigits(0x00c3, 1, this.picturesReceivedMale);
		}
		if(typeof data.picturesReceivedFemale === 'number' && data.picturesReceivedFemale>=0 && data.picturesReceivedFemale<=99){
			this.picturesReceivedFemale=data.picturesReceivedFemale;
			this.writeDoubleDigits(0x00c4, 1, this.picturesReceivedFemale);
		}
		if(typeof data.scoreSpaceFever === 'number' && data.scoreSpaceFever>=0 && data.scoreSpaceFever<=99999999){
			this.scoreSpaceFever=data.scoreSpaceFever;
			this.writeDoubleDigits(0x00c5, 4, this.scoreSpaceFever);
		}
		if(typeof data.scoreBall === 'number' && data.scoreBall>=0 && data.scoreBall<=99999999){
			this.scoreBall=data.scoreBall;
			this.writeDoubleDigits(0x00c9, 2, this.scoreBall);
		}
		if(typeof data.scoreRunRunRun === 'number' && data.scoreRunRunRun>=0 && data.scoreRunRunRun<=9999){
			this.scoreRunRunRun=data.scoreRunRunRun;
			this.writeDoubleDigits(0x00cb, 2, 9999 - this.scoreRunRunRun);
		}
		this.recalculateChecksum(0x0000, 0x00d7);
	}

	getMissingFeats(){
		const newData={};
		if(this.picturesTaken<60)
			newData.picturesTaken=60;
		if(this.picturesErased<60)
			newData.picturesErased=60;
		if(this.picturesTransfered<15)
			newData.picturesTransfered=15;
		if(this.picturesReceivedMale<5)
			newData.picturesReceivedMale=5;
		if(this.picturesReceivedFemale<5)
			newData.picturesReceivedFemale=5;
		if(this.picturesPrinted<30)
			newData.picturesPrinted=30;
		if(this.scoreSpaceFever<7000)
			newData.scoreSpaceFever=7000;
		if(this.scoreBall<1000)
			newData.scoreBall=1000;
		if(this.scoreRunRunRun>1600)
			newData.scoreRunRunRun=1600;

		return newData;
		//this.setData(newData);
	}
}
class PocketCameraUserData extends PocketCameraData{
	constructor(arrayBuffer){
		super(arrayBuffer, 0x2fb8, 28);

		this.parseUserData();
	}
	parseUserData(){
		this.userId=this.readDoubleDigits(0x0000, 4, true);
		this.userName=this.readText(0x0004, 9);
		const userGenderBlood=this.readByte(0x000d);
		this.userGender=userGenderBlood & 0x03;
		this.userBloodType=userGenderBlood >> 2;
		this.birthdayYear=this.readDoubleDigits(0x000e, 2, true);
		this.birthdayMonth=this.readDoubleDigits(0x0010, 1, true);
		this.birthdayDay=this.readDoubleDigits(0x0011, 1, true);
	}
	setUserData(metadata){
		if(typeof metadata !== 'object')
			throw new TypeError('metadata must be an object');

		if(typeof metadata.userId === 'number' && metadata.userId>=0 && metadata.userId<=99999999){
			this.userId=metadata.userId;
			this.writeDoubleDigits(0x0000, 4, this.userId.toString(), true);
		}
		if(typeof metadata.userName === 'string'){
			this.userName=metadata.userName;
			this.writeText(0x0004, this.userName, 9);
		}
		if(typeof metadata.userGender === 'number' && metadata.userGender>=0 && metadata.userGender<=2){
			this.userGender=metadata.userGender;
			const userGenderBlood=(this.userBloodType << 2) | this.userGender;
			this.writeByte(0x000d, userGenderBlood);
		}
		if(typeof metadata.userBloodType === 'number' && metadata.userBloodType>=0 && metadata.userGender<=4){
			this.userBloodType=metadata.userBloodType;
			const userGenderBlood=(this.userBloodType << 2) | this.userGender;
			this.writeByte(0x000d, userGenderBlood);
		}
		if(typeof metadata.birthdayYear === 'string'){
			this.birthdayYear=metadata.birthdayYear;
			this.writeDoubleDigits(0x000e, 2, this.birthdayYear, true);
		}
		if(typeof metadata.birthdayMonth === 'string'){
			this.birthdayMonth=metadata.birthdayMonth;
			this.writeDoubleDigits(0x0010, 1, this.birthdayMonth, true);
		}
		if(typeof metadata.birthdayDay === 'string'){
			this.birthdayDay=metadata.birthdayDay;
			this.writeDoubleDigits(0x0011, 1, this.birthdayDay, true);
		}

		this.parseUserData();
		this.recalculateChecksum(0x0000, 23);
	}
}

class PocketCameraPicture extends PocketCameraData{
	constructor(arrayBuffer, offset, noMetadata){
		super(arrayBuffer, offset, 0x1000);

		this.hasMetadata=!noMetadata;
		this.parseMetaData();
	}

	parseMetaData(){
		if(!this.hasMetadata)
			return;

		this.userId=this.readDoubleDigits(0x0f00, 4, true);
		this.userName=this.readText(0x0f04, 9);
		const userGenderBlood=this.readByte(0x0f0d);
		this.userGender=userGenderBlood & 0x03;
		this.userBloodType=userGenderBlood >> 2;
		this.birthdayYear=this.readDoubleDigits(0x0f0e, 2, true);
		this.birthdayMonth=this.readDoubleDigits(0x0f10, 1, true);
		this.birthdayDay=this.readDoubleDigits(0x0f11, 1, true);
		//this.unknownBytes=this.readBytes(0x0f12, 3);
		const commentLine0=this.readText(0x0f15, 9);
		const commentLine1=this.readText(0x0f15 + 9, 9);
		const commentLine2=this.readText(0x0f15 + 18, 9);
		this.comment=commentLine0+'\n'+commentLine1+'\n'+commentLine2;
		this.transfered=!!(this.readByte(0x0f33) & 0x01);
		//this.unknownBytes2=this.readBytes(0x0f34, 2);
		const hotspotsEnabled=this.readBytes(0x0f36, 5);
		const hotspotsX=this.readBytes(0x0f3b, 5);
		const hotspotsY=this.readBytes(0x0f40, 5);
		const hotspotsSound=this.readBytes(0x0f45, 5);
		const hotspotsEffect=this.readBytes(0x0f4a, 5);
		const hotspotsPicture=this.readBytes(0x0f4f, 5);
		this.hotspots=(new Array(5)).map(function(blank, i){
			return {
				enabled:!!(hotspotsEnabled[i] & 0x01),
				x:hotspotsX[i],
				y:hotspotsY[i],
				sound:hotspotsSound[i],
				effect:hotspotsEffect[i],
				picture:hotspotsPicture[i],
			}
		});
		this.border=this.readByte(0x0f54);

		//this.sumByte=this.readByte(0x0f5a);
		//this.xorByte=this.readByte(0x0f5b);
	}
	setMetaData(metadata){
		if(!this.hasMetadata)
			return;
		else if(typeof metadata !== 'object')
			throw new TypeError('metadata must be an object');

		if(typeof metadata.userId === 'number' && metadata.userId>=0 && metadata.userId<=99999999){
			this.userId=metadata.userId;
			this.writeDoubleDigits(0x0f00, 4, this.userId.toString(), true);
		}
		if(typeof metadata.userName === 'string'){
			this.userName=metadata.userName;
			this.writeText(0x0f04, this.userName, 9);
		}
		if(typeof metadata.comment === 'string'){
			const commentLines=(metadata.comment +'\n\n').split(/\r?\n/);
			const commentLine0=_fixString(commentLines[0], 9);
			const commentLine1=_fixString(commentLines[1], 9);
			const commentLine2=_fixString(commentLines[2], 9);
			this.comment=metadata.comment;
			this.writeText(0x0f15, commentLine0, 9);
			this.writeText(0x0f15 + 9, commentLine1, 9);
			this.writeText(0x0f15 + 18, commentLine2, 9);
		}
		if(typeof metadata.userGender === 'number' && metadata.userGender>=0 && metadata.userGender<=2){
			this.userGender=metadata.userGender;
			const userGenderBlood=(this.userBloodType << 2) | this.userGender;
			this.writeByte(0x0f0d, userGenderBlood);
		}
		if(typeof metadata.userBloodType === 'number' && metadata.userBloodType>=0 && metadata.userGender<=4){
			this.userBloodType=metadata.userBloodType;
			const userGenderBlood=(this.userBloodType << 2) | this.userGender;
			this.writeByte(0x0f0d, userGenderBlood);
		}
		if(typeof metadata.birthdayYear === 'string'){
			this.birthdayYear=metadata.birthdayYear;
			this.writeDoubleDigits(0x0f0e, 2, this.birthdayYear, true);
		}
		if(typeof metadata.birthdayMonth === 'string'){
			this.birthdayMonth=metadata.birthdayMonth;
			this.writeDoubleDigits(0x0f10, 1, this.birthdayMonth, true);
		}
		if(typeof metadata.birthdayDay === 'string'){
			this.birthdayDay=metadata.birthdayDay;
			this.writeDoubleDigits(0x0f11, 1, this.birthdayDay, true);
		}
		if(typeof metadata.border === 'number' && metadata.border>=0 && metadata.border<=19){
			this.border=metadata.border;
			this.writeByte(0x0f54, this.border);
		}
		if(typeof metadata.transfered === 'boolean'){
			this.transfered=metadata.transfered;
			this.writeByte(0x0f33, this.transfered? 0x01 : 0x00);
		}

		this.parseMetaData();
		this.recalculateChecksum();
	}

	injectData(arrayBuffer){
		if(this.hasMetadata && arrayBuffer.byteLength===256){ // thumbnail
			super.injectData(0x0e00, arrayBuffer);
		}else if(arrayBuffer.byteLength===3584 || arrayBuffer.byteLength===3932){ // picture without or with metadata
			if(!this.hasMetadata && arrayBuffer.byteLength===3932)
				arrayBuffer=arrayBuffer.slice(0, 3584);

			super.injectData(0x0000, arrayBuffer);
			if(this.hasMetadata){
				this.parseMetaData();
				this.recalculateChecksum();
			}
		}else{
			throw new Error('Invalid data length');
		}
	}


	recalculateChecksum(){
		return super.recalculateChecksum(0x0f00, 90);
	}

	toCanvas(zoom, grayscale){
		const currentPalette=grayscale? PALETTES[0]: getCurrentPalette();
		const tilesData=this.readTilesData(0, 16 * 14, currentPalette);

		return _buildCanvasMap(tilesData, 16, 14, zoom);
	}
	toCanvasThumbnail(){
		const currentPalette=getCurrentPalette();
		const tilesData=this.readTilesData(16 * 14, 4 * 4, currentPalette);

		return _buildCanvasMap(tilesData, 4, 4, 1);
	}
}
class PocketCameraFrame extends PocketCameraData{
	constructor(arrayBuffer, offset){
		super(arrayBuffer, offset, 0x0688);
	}

	injectData(arrayBuffer){
		if (arrayBuffer.byteLength!==0x0688) {
			throw new Error('Invalid data length');
		}
		super.injectData(0x0000, arrayBuffer);
	}

	toCanvas(zoom, grayscale){
		const currentPalette=grayscale? PALETTES[0]: getCurrentPalette();

		const tilesData=this.readTilesData(0, 96, currentPalette);

		let readOffset=96*16;
		const map=new Array(20*18);
		/* TOP */
		for (var y=0; y<2; y++) {
			for (var x=0; x<20; x++) {
				map[(y * 20) + x]=this.readByte(readOffset++);
			}
		}
		/* BOTTOM */
		for (var y=0; y<2; y++) {
			for (var x=0; x<20; x++) {
				map[((16 + y) * 20) + x]=this.readByte(readOffset++);
			}
		}
		/* LEFT AND RIGHT */
		for (var y=0; y<14; y++) {
			/* LEFT */
			map[((2 + y) * 20) + 0]=this.readByte(readOffset++);
			map[((2 + y) * 20) + 1]=this.readByte(readOffset++);
			for (var x=0; x<16; x++) {
				map[((2 + y) * 20) + (2 + x)]=-1;
			}
			/* RIGHT */
			map[((2 + y) * 20) + 18]=this.readByte(readOffset++);
			map[((2 + y) * 20) + 19]=this.readByte(readOffset++);
		}

		return _buildCanvasMap(tilesData, 20, 18, zoom, map);
	}
}
class PocketCameraCartridgeGameFace extends PocketCameraData{
	constructor(arrayBuffer, offset){
		super(arrayBuffer, offset, 0x0e00);
	}

	injectData(arrayBuffer){
		if (arrayBuffer.byteLength!==0x0e00) {
			throw new Error('Invalid data length');
		}
		super.injectData(0x0000, arrayBuffer);
	}

	toCanvas(zoom, grayscale){
		const currentPalette=grayscale? PALETTES[0]: getCurrentPalette();
		const tilesData=this.readTilesData(0, 16 * 14, currentPalette);

		return _buildCanvasMap(tilesData, 8, 28, zoom);
	}
}
class PocketCameraFrameWild extends PocketCameraData{
	constructor(arrayBuffer, offset){
		super(arrayBuffer, offset, 0x1500);
	}

	injectData(arrayBuffer){
		if (arrayBuffer.byteLength!==0x1500) {
			throw new Error('Invalid data length');
		}
		super.injectData(0x0000, arrayBuffer);
	}

	toCanvas(zoom, grayscale){
		const currentPalette=grayscale? PALETTES[0]: getCurrentPalette();

		const tilesData=this.readTilesData(0, 336, currentPalette);

		let tileIndex=0;
		const map=new Array(20*28);
		/* TOP */
		for (var y=0; y<5; y++) {
			for (var x=0; x<20; x++) {
				map[(y * 20) + x]=tileIndex++;
			}
		}
		/* BOTTOM */
		for (var y=0; y<9; y++) {
			for (var x=0; x<20; x++) {
				map[((19 + y) * 20) + x]=tileIndex++;
			}
		}
		/* LEFT AND RIGHT */
		for (var y=0; y<14; y++) {
			/* LEFT */
			map[((5 + y) * 20) + 0]=tileIndex++;
			map[((5 + y) * 20) + 1]=tileIndex++;
			for (var x=0; x<16; x++) {
				map[((5 + y) * 20) + (2 + x)]=-1;
			}
			/* RIGHT */
			map[((5 + y) * 20) + 18]=tileIndex++;
			map[((5 + y) * 20) + 19]=tileIndex++;
		}

		return _buildCanvasMap(tilesData, 20, 28, zoom, map);
	}
}
class PocketCameraSavegame{
	constructor(arrayBuffer){
		this._arrayBuffer=arrayBuffer;

		this.userData=new PocketCameraUserData(arrayBuffer);
		this.generalData=new PocketCameraGeneralData(arrayBuffer);
		this.album=new PocketCameraAlbum(arrayBuffer);

		this.pictures = [];
		for(var i=0; i<30; i++){
			const offset=0x2000 + i*0x1000;
			const picture=new PocketCameraPicture(arrayBuffer, offset);
			this.pictures.push(picture);
		}
		this.gameFace=new PocketCameraPicture(arrayBuffer, 0x11fc, true); //game face
	}

	checkCoroCoroContent(){
		const u8array=new Uint8Array(this._arrayBuffer);
		return appSettings.regionJapan && u8array[0x001ffc] === 0x00 && u8array[0x001ffd] === 0x56 && u8array[0x001ffe] === 0x56 && u8array[0x001fff] === 0x53
	}
	unlockCoroCoroContent(){
		if(!this.checkCoroCoroContent()){
			const u8array=new Uint8Array(this._arrayBuffer);
			u8array[0x001ffc + 0]=0x00;
			u8array[0x001ffc + 1]=0x56;
			u8array[0x001ffc + 2]=0x56;
			u8array[0x001ffc + 3]=0x53;
		}
	}
}


var currentROM, currentSRAM;
var currentPicture;
const _loadFile=function(arrayBuffer, fileName){
	const u8array=new Uint8Array(arrayBuffer);
	if(
		u8array.length===1048576 &&
		u8array[0x0100]===0x00 &&
		u8array[0x0101]===0xc3 &&
		u8array[0x0102]===0x50 &&
		u8array[0x0103]===0x01
	){
		currentSRAM=null;
		currentROM=new PocketCameraCartridge(arrayBuffer);
		document.getElementById('file-type').innerHTML='ROM';
		document.getElementById('file-type').className='file-type-rom';
		document.getElementById('file-name').innerHTML=fileName;
		document.getElementById('file-name').title=fileName;
		document.getElementById('btn-file-save').disabled=false;

		if(!appSettings.regionJapan && currentROM.applyPatch(0, 0x0134, [0x50, 0x4f, 0x43, 0x4b, 0x45, 0x54, 0x43, 0x41, 0x4d, 0x45, 0x52, 0x41], null)){
			appSettings.regionJapan=true;
			document.getElementById('select-settings-region-japan').value=1;
			_updateAppName();
			currentROM=new PocketCameraCartridge(arrayBuffer); //force parse data again
		}else if(appSettings.regionJapan && currentROM.applyPatch(0, 0x0134, [0x47, 0x41, 0x4d, 0x45, 0x42, 0x4f, 0x59, 0x43, 0x41, 0x4d, 0x45, 0x52, 0x41], null)){
			appSettings.regionJapan=false;
			document.getElementById('select-settings-region-japan').value=0;
			_updateAppName();
			currentROM=new PocketCameraCartridge(arrayBuffer); //force parse data again
		}

		currentROM.applyPatch(8, !appSettings.regionJapan? 0x4fa5 : 0x4f5b, [0x3e, 0x11], [0x3e, 0x11 + 1]); //ld a, 17+1: enable border B, browse left
		currentROM.applyPatch(8, !appSettings.regionJapan? 0x4fb6 : 0x4f6c, [0xfe, 0x12], [0xfe, 0x12 + 1]); //cp a, 18+1: enable border B, browse right
		if(!appSettings.regionJapan)
			currentROM.applyPatch(8, 0x5331, [0x0e, 0x07], [0x0e, 0x07 + 1]); //ld c, 7+1: enable wild frame 8


		currentROM.applyPatch(8, 0x4238, [0xaf], [0x00]); //disable forced border 19 in PRINT menu

		if(currentROM.applyPatch(4, 0x7502, [0xcd, 0x56, 0x09], null)){ //international
			currentROM.applyPatch(4, 0x7ff0, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [0xcd, 0x56, 0x09, 0xfe, 0x12, 0xc0, 0xfa, 0x54, 0xcf, 0xea, 0xc1, 0xd7, 0xc9]) && //add new subroutine that allows any border to be shown in VIEW menu for B ALBUM
			currentROM.applyPatch(4, 0x7502, [0xcd, 0x56, 0x09], [0xcd, 0xf0, 0x7f]); //call to new subroutine
		}else if(currentROM.applyPatch(4, 0x7556, [0xcd, 0xc1, 0x08], null)){ //japan
			currentROM.applyPatch(4, 0x7ff0, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [0xcd, 0xc1, 0x08, 0xfe, 0x12, 0xc0, 0xfa, 0x54, 0xcf, 0xea, 0xc1, 0xd7, 0xc9]) && //add new subroutine that allows any border to be shown in VIEW menu for B ALBUM
			currentROM.applyPatch(4, 0x7556, [0xcd, 0xc1, 0x08], [0xcd, 0xf0, 0x7f]); //call to new subroutine
		}

		buildAllAlbums();
	}else if(
		(u8array.length===131072 || u8array.length===(131072+16) /* 16 extra bytes for some emulators/devices that store RTC data */) &&
		u8array[0x2f55]===0x4d &&
		u8array[0x2f56]===0x61 &&
		u8array[0x2f57]===0x67 &&
		u8array[0x2f58]===0x69 &&
		u8array[0x2f59]===0x63
	){
		currentROM=null;
		currentSRAM=new PocketCameraSavegame(arrayBuffer);
		document.getElementById('file-type').innerHTML='SRAM';
		document.getElementById('file-type').className='file-type-sram';
		document.getElementById('file-name').innerHTML=fileName;
		document.getElementById('file-name').title=fileName;
		document.getElementById('btn-file-save').disabled=false;

		buildAllAlbums();
	}else{
		displayAndThrowError('Invalid file');
	}
};

const _saveFile=function(arrayBuffer, fileName){
	const blob = new Blob([arrayBuffer], {type: 'application/octet-stream'});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

const _updateAppName=function(){
	document.getElementById('logo').src='assets/logo_'+(appSettings.regionJapan? 'jp' : 'en')+'.png';
	document.head.querySelector('title').innerHTML=appSettings.regionJapan? 'Pocket Camera Manager' : 'Game Boy Camera Manager';
};

window.addEventListener('load', function(evt){
	/* settings theme */
	document.body.className=appSettings.theme;
	_updateAppName();
	document.getElementById('select-settings-theme').value=appSettings.theme;
	document.getElementById('select-settings-region-japan').value=appSettings.regionJapan? 1 : 0;
	document.getElementById('select-settings-palette').value=appSettings.exportPalette;

	document.getElementById('form-settings').addEventListener('submit', function(evt){
		const originalPalette=appSettings.exportPalette;
		const originalRegionJapan=appSettings.regionJapan;
		appSettings.theme=document.getElementById('select-settings-theme').value;
		appSettings.regionJapan=!!parseInt(document.getElementById('select-settings-region-japan').value);
		appSettings.exportPalette=parseInt(document.getElementById('select-settings-palette').value);

		document.body.className=appSettings.theme+' transition';
		_updateAppName();


		if((originalPalette!==appSettings.exportPalette) || (originalRegionJapan!==appSettings.regionJapan)){
			if(currentROM && (originalRegionJapan!==appSettings.regionJapan)){
				currentROM.pictures.forEach(function(picture){
					picture.parseMetaData();
				});
			}
			_refreshCurrentPicture();
			buildAllAlbums();
		}
		_saveSettings();
	});

	/* UI events */
	document.getElementById('mobile-backdrop').addEventListener('click', function(evt){
		document.querySelector('aside').className='';
		this.className='';
	});
	document.getElementById('input-edit-user-id').addEventListener('change', function(evt){
		this.value=this.value.replace(/[^0-9]/g, '').substr(0, 8);
	});
	document.getElementById('input-edit-user-name').addEventListener('change', function(evt){
		this.value=_fixString(this.value, 9);
	});
	document.getElementById('input-edit-birthday-year').addEventListener('change', function(evt){
		this.value=this.value.replace(/[^0-9\-\?]/g, '').substr(0, 4);
		if(this.value.length>0)
			this.value=this.value.padStart(4, '-');
	});
	document.getElementById('input-edit-birthday-month').addEventListener('change', function(evt){
		this.value=this.value.replace(/[^0-9\-\?]/g, '').substr(0, 2);
		if(/^\d$/.test(this.value)){
			this.value='0'+this.value;
		}
	});
	document.getElementById('input-edit-birthday-day').addEventListener('change', function(evt){
		this.value=this.value.replace(/[^0-9\-\?]/g, '').substr(0, 2);
		if(/^\d$/.test(this.value)){
			this.value='0'+this.value;
		}
	});
	document.getElementById('textarea-edit-comment').addEventListener('change', function(evt){
		const commentLines=(this.value +'\n\n').split(/\r?\n/);
		const commentLine0=_fixString(commentLines[0], 9);
		const commentLine1=_fixString(commentLines[1], 9);
		const commentLine2=_fixString(commentLines[2], 9);
		this.value=(commentLine0+'\n'+commentLine1+'\n'+commentLine2).replace(/(\r?\n)+$/, '');
	});

	document.getElementById('btn-settings').addEventListener('click', function(evt){
		document.getElementById('dialog-settings').showModal();
	});
	document.body.addEventListener('click', function(evt){
		document.getElementById('popover-export').className='popover';
	});
	document.getElementById('btn-export').addEventListener('click', function(evt){
		evt.stopPropagation();
		document.getElementById('popover-export').className='popover open';
	});
	document.getElementById('popover-export').addEventListener('click', function(evt){
		evt.stopPropagation();
	});
	document.getElementById('btn-export-binary').addEventListener('click', _evtClickExportPicture);
	document.getElementById('btn-export-image').addEventListener('click', _evtClickExportImage);
	document.getElementById('btn-export-image-original').addEventListener('click', _evtClickExportImageOriginal);
	document.getElementById('btn-import').addEventListener('click', _evtClickImportPicture);
	document.getElementById('btn-edit').addEventListener('click', _evtClickEditPicture);
	document.getElementById('btn-cancel-edit').addEventListener('click', function(evt){
		document.getElementById('dialog-edit').close();
	});

	document.getElementById('btn-delete-restore').addEventListener('click', function(evt){
		const pictureIndex=currentSRAM.pictures.indexOf(currentPicture);
		if(pictureIndex!==-1){
			const position=currentSRAM.album.getIndexed().indexOf(pictureIndex);
			if(position!==-1){
				//delete
				currentSRAM.album.removePicture(position);
				document.getElementById('btn-delete-restore').innerHTML=_('Restore');
			}else{
				//restore
				currentSRAM.album.insertPicture(pictureIndex);
				document.getElementById('btn-delete-restore').innerHTML=_('Delete');
			}
			refreshAlbum('a');
			refreshAlbum('deleted');
		}
	});

	document.getElementById('btn-file-load').addEventListener('click', function(evt){
		document.getElementById('input-file').click();
	});
	document.getElementById('input-file').addEventListener('change', function(evt){
		const fileReader=new FileReader();
		fileReader.onload=function(evt) {
			_loadFile(evt.target.result, document.getElementById('input-file').files[0].name);
		};
		fileReader.readAsArrayBuffer(this.files[0]);
	});
	document.getElementById('btn-file-save').addEventListener('click', function(evt){
		if(currentSRAM){
			_saveFile(currentSRAM._arrayBuffer, 'new_savegame.sav');
		}else if(currentROM){
			currentROM.fixGameBoyGlobalChecksum();
			_saveFile(currentROM._arrayBuffer, 'game_boy_camera_custom.gb');
		}
	});
	document.getElementById('form-edit').addEventListener('submit', function(evt){
		currentPicture.setMetaData({
			userId:parseInt(document.getElementById('input-edit-user-id').value),
			userName:document.getElementById('input-edit-user-name').value,
			userGender:parseInt(document.getElementById('select-edit-user-gender').value),
			userBloodType:parseInt(document.getElementById('select-edit-user-blood').value),
			birthdayYear:document.getElementById('input-edit-birthday-year').value.padStart(4, '-'),
			birthdayMonth:document.getElementById('input-edit-birthday-month').value.padStart(2, '-'),
			birthdayDay:document.getElementById('input-edit-birthday-day').value.padStart(2, '-'),
			comment:document.getElementById('textarea-edit-comment').value,
			border:parseInt(document.getElementById('select-edit-border').value),
			//transfered:document.getElementById('checkbox-transfered').checked
		});

		_refreshCurrentPicture();
	});

	/* DEBUG */
	/*fetch('example.sav').then(function(response) {
		return response.arrayBuffer();
	}).then(function(arrayBuffer) {
		_loadFile(arrayBuffer, 'example.sav');
	}).catch(function(err) {
		console.error('Error loading save file:', err);
	});*/
});








const getCurrentPalette=function(){
	return PALETTES[appSettings.exportPalette];
};



/* SETTINGS */
const appSettings={
	theme:'red',
	regionJapan:false,
	exportPalette:2
};
/* load settings */
try{
	const loadedSettings=JSON.parse(window.localStorage.getItem('game-boy-camera-manager'));

	const loadedTheme=loadedSettings.theme;
	if(['red', 'blue', 'yellow', 'green', 'purple', 'gold'].indexOf(loadedTheme)!==-1)
		appSettings.theme=loadedTheme;

	appSettings.regionJapan=!!loadedSettings.regionJapan;

	const loadedExportPalette=loadedSettings.exportPalette;
	if([0,1,2,3,4].indexOf(loadedExportPalette)!==-1)
		appSettings.exportPalette=loadedExportPalette;

}catch(ex){}
const _resetSettings=function(){
	window.localStorage.removeItem('game-boy-camera-manager');
};
const _saveSettings=function(){
	window.localStorage.setItem('game-boy-camera-manager', JSON.stringify(appSettings));
};





let workerQuantize = null;
function quantizeImportedImage(imageData, thumbnail) {
	if (workerQuantize)
		workerQuantize.terminate();

	let quantizedImageData;
	workerQuantize = new Worker('./app/tiledpalettequant/worker.js');
	workerQuantize.onmessage = function (event) {
		const data = event.data;
		if (data.action === 2) { //UpdateQuantizedImage
			quantizedImageData = data.imageData;
		}else if (data.action === 4) { //DoneQuantization
			const newImageData = new ImageData(quantizedImageData.data, quantizedImageData.width, quantizedImageData.height);

			const newCanvas = document.createElement('canvas');
			newCanvas.width = quantizedImageData.width;
			newCanvas.height = quantizedImageData.height;
			const newCtx = newCanvas.getContext('2d');
			newCtx.putImageData(newImageData, 0, 0);

			importImage(newCanvas, thumbnail);
		}
	};

	workerQuantize.postMessage({
		action: 0, //StartQuantization
		imageData: imageData,
		quantizationOptions: {
			tileWidth: 8,
			tileHeight: 8,
			numPalettes: 1,
			colorsPerPalette: 4,
			bitsPerChannel: 5,
			fractionOfPixels: 1.0,
			colorZeroBehaviour: 1,
			colorZeroValue: [255, 255, 255],
			dither: 2, //Slow
			ditherWeight: 0.5,
			ditherPattern: 0 //Diagonal4
		},
	});
};



const _getClosestNumber=function(number, arr){
	let closest=arr[0];
	for(var i=1; i<arr.length; i++){
		if(Math.abs(arr[i]-number)<Math.abs(closest-number)){
			closest=arr[i];
		}
	}
	return closest;
}

const importImage=function(img, thumbnail){
	const tileColumns=currentPicture instanceof PocketCameraCartridgeGameFace? 8 : (thumbnail? 4 : 16);
	const tileRows=currentPicture instanceof PocketCameraCartridgeGameFace? 28 : (thumbnail? 4 : 14);
	const newCanvas=document.createElement('canvas');
	newCanvas.width=tileColumns * 8;
	newCanvas.height=tileRows * 8;
	const ctx=newCanvas.getContext('2d');
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	ctx.filter = 'grayscale(1)';
	if(img.width===newCanvas.width && img.height===newCanvas.height){
		ctx.drawImage(img, 0, 0);
	}else{
		//draw image while keeping original aspect ratio and filling the canvas both vertically and horizontally
		const scaleX = newCanvas.width / img.width;
		const scaleY = newCanvas.height / img.height;
		const scale = Math.max(scaleX, scaleY);
		const x = (newCanvas.width / 2) - (img.width / 2) * scale;
		const y = (newCanvas.height / 2) - (img.height / 2) * scale;
		ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
	}

	const imageData=ctx.getImageData(0, 0, newCanvas.width, newCanvas.height);

	const currentColors=[];
	let quantize=false;
	let readOffset=0;
	for(var i=0; i<(newCanvas.width*newCanvas.height); i++){
		const color=imageData.data[readOffset];
		readOffset+=4; //skip alpha

		if(!quantize && currentColors.indexOf(color)===-1){
			currentColors.push(color);
			if(currentColors.length>4){
				quantize=true;
				break;
			}
		}
	}

	readOffset=0;
	if(quantize){
		const colors16=[
			255,
			240,
			//224,
			//208,
			192,
			176,
			160,
			144,
			128,
			112,
			96,
			80,
			64,
			//48,
			//32,
			16,
			0
		];

		/* normalize colors for better results when quantizing */
		for(var i=0; i<(newCanvas.width*newCanvas.height); i++){
			const color=imageData.data[readOffset];
			const closestColor=_getClosestNumber(color, colors16);

			imageData.data[readOffset + 0]=closestColor;
			imageData.data[readOffset + 1]=closestColor;
			imageData.data[readOffset + 2]=closestColor;
			imageData.data[readOffset + 3]=255;
			readOffset+=4; //skip
		}
		ctx.putImageData(imageData, 0, 0);

		quantizeImportedImage(imageData, thumbnail);
	}else{
		for(var i=0; i<(newCanvas.width*newCanvas.height); i++){
			const color=imageData.data[readOffset];
			const closestColor=_getClosestNumber(color, GRAYSCALE_8BPP);

			imageData.data[readOffset + 0]=closestColor;
			imageData.data[readOffset + 1]=closestColor;
			imageData.data[readOffset + 2]=closestColor;
			imageData.data[readOffset + 3]=255;
			readOffset+=4; //skip
		}

		ctx.putImageData(imageData, 0, 0);

		/* convert image data to Game Boy tile data*/
		const u8array=new Uint8Array(new ArrayBuffer(tileColumns*tileRows * 16));
		let writeOffset=0;
		for(var y=0; y<tileRows; y++){
			for (var x=0; x<tileColumns; x++) {
				const tileImageData=ctx.getImageData(x*8, y*8, 8, 8);
				readOffset=0;
				for (var i=0; i<8; i++) {
					let byte0=0x00;
					let byte1=0x00;

					for(var j=0; j<8; j++){
						let colorIndex;
						if(thumbnail){
							if(
								(y===0 && i===0) ||
								(y===3 && i===3) ||
								(y<3 && x===0 && j===0) ||
								(y<3 && x===3 && j===7) || 
								(y===3 && i<3 && x===0 && j===0) ||
								(y===3 && i<3 && x===3 && j===7)
							){
								colorIndex=3; //black
							}else if(y===3 && i>3){
								colorIndex=0; //white
							}else{
								colorIndex=GRAYSCALE_8BPP.indexOf(tileImageData.data[readOffset]);
							}
						}else{
							colorIndex=GRAYSCALE_8BPP.indexOf(tileImageData.data[readOffset]);
						}
						const colorByte0=(colorIndex >> 0) & 0x01;
						const colorByte1=(colorIndex >> 1) & 0x01;
						byte0|=(colorByte0 << (7-j));
						byte1|=(colorByte1 << (7-j));
						readOffset+=4;
					}
					u8array[writeOffset++]=byte0;
					u8array[writeOffset++]=byte1;
				}
			}
		}

		if(currentPicture instanceof PocketCameraPicture && currentPicture.hasMetadata && !thumbnail){
			currentPicture.injectData(u8array); //inject photo
			importImage(img, true); //generate thumbnail
		}else{
			currentPicture.injectData(u8array);
			_refreshCurrentPicture(true);
		}
	}
}


function _buildCanvasMap(tilesData, width, height, zoom, map){
	if(!map)
		map=Array.from({length: width * height}, (_, i) => i);

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	canvas.width=width * 8;
	canvas.height=height * 8;

	let mapTileIndex=0;
	for (var y=0; y<height; y++) {
		for (var x=0; x<width; x++) {
			const tileIndex=map[mapTileIndex];
			if(tileIndex!==-1){
				ctx.putImageData(tilesData[tileIndex], x*8, y*8);
			}
			mapTileIndex++;
		}
	}
	if(zoom && zoom>1 && zoom<4){
		zoom=Math.floor(zoom);
		const scaledCanvas = document.createElement('canvas');
		const ctx = scaledCanvas.getContext('2d');
		scaledCanvas.width=canvas.width*zoom;
		scaledCanvas.height=canvas.height*zoom;

		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width*zoom, canvas.height*zoom);

		return scaledCanvas;
	}
	return canvas;
}

const GRAYSCALE_8BPP=[
	255,
	168,
	84,
	0
];
const _buildGBTileDataFromGrayscaleImageData=function(tileImageData){
	let readOffset=0;
	const tileData=[];
	for (var i=0; i<8; i++) {
		let byte0=0x00;
		let byte1=0x00;

		for(var j=0; j<8; j++){
			const closestColor=_getClosestNumber(tileImageData.data[readOffset], GRAYSCALE_8BPP);
			const colorIndex=GRAYSCALE_8BPP.indexOf(closestColor);
			const colorByte0=(colorIndex >> 0) & 0x01;
			const colorByte1=(colorIndex >> 1) & 0x01;
			byte0|=(colorByte0 << (7-j));
			byte1|=(colorByte1 << (7-j));
			readOffset+=4;
		}
		tileData.push(byte0);
		tileData.push(byte1);
	}
	return tileData;
}

const _checkMapTile=function(tileImageData, tilesData){
	const tileData=_buildGBTileDataFromGrayscaleImageData(tileImageData);

	/* find if tileData already exists in tilesData */
	let tileDataIndex=-1;
	for(var i=0; i<tilesData.length && tileDataIndex===-1; i++){
		for(var j=0; j<16; j++){
			if(tilesData[i][j]!==tileData[j]){
				break;
			}else if(j===15){
				tileDataIndex=i;
			}
		}
	}
	if(tileDataIndex===-1){
		tilesData.push(tileData);
		if(tilesData.length>96)
			displayAndThrowError('Too many tiles, only 96 tiles are supported');
		return tilesData.length-1;
	}else{
		return tileDataIndex;
	}
}
const importFrame=function(img){
	if(img.width!==160 || img.height!==144)
		displayAndThrowError('Invalid image size, must be 160x144');

	const newCanvas=document.createElement('canvas');
	newCanvas.width=160;
	newCanvas.height=144;
	const ctx=newCanvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;
	ctx.filter = 'grayscale(1)';
	ctx.drawImage(img, 0, 0);

	const tilesData=[];
	const mapData=[];
	/* TOP */
	for(var y=0; y<2; y++){
		for(var x=0; x<20; x++){
			const tileImageData=ctx.getImageData(x*8, y*8, 8, 8);
			const tileDataIndex=_checkMapTile(tileImageData, tilesData);
			mapData.push(tileDataIndex);
		}
	}
	/* BOTTOM */
	for(var y=0; y<2; y++){
		for(var x=0; x<20; x++){
			const tileImageData=ctx.getImageData(x*8, 128+y*8, 8, 8);
			const tileDataIndex=_checkMapTile(tileImageData, tilesData);
			mapData.push(tileDataIndex);
		}
	}
	/* LEFT AND RIGHT */
	for (var y=0; y<14; y++) {
		/* LEFT */
		for (var x=0; x<2; x++) {
			const tileImageData=ctx.getImageData(x*8, 16+y*8, 8, 8);
			const tileDataIndex=_checkMapTile(tileImageData, tilesData);
			mapData.push(tileDataIndex);
		}
		/* RIGHT */
		for (var x=0; x<2; x++) {
			const tileImageData=ctx.getImageData(144+x*8, 16+y*8, 8, 8);
			const tileDataIndex=_checkMapTile(tileImageData, tilesData);
			mapData.push(tileDataIndex);
		}
	}
	const finalData=new Uint8Array(new ArrayBuffer(0x0688));
	let writeOffset=0;
	/* write tiles data */
	for(var i=0; i<tilesData.length; i++){
		for(var j=0; j<16; j++){
			finalData[writeOffset++]=tilesData[i][j];
		}
	}
	/* write map data */
	writeOffset=0x0600;
	for(var i=0; i<mapData.length; i++){
		finalData[writeOffset++]=mapData[i];
	}
	currentPicture.injectData(finalData.buffer);
	_refreshCurrentPicture(true);
}
const importFrameWild=function(img){
	if(img.width!==160 || img.height!==224)
		displayAndThrowError('Invalid image size, must be 160x224');

	const newCanvas=document.createElement('canvas');
	newCanvas.width=160;
	newCanvas.height=224;
	const ctx=newCanvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;
	ctx.filter = 'grayscale(1)';
	ctx.drawImage(img, 0, 0);

	const tilesData=[];

	/* TOP */
	for(var y=0; y<5; y++){
		for(var x=0; x<20; x++){
			const tileImageData=ctx.getImageData(x*8, y*8, 8, 8);
			const tileData=_buildGBTileDataFromGrayscaleImageData(tileImageData);
			tilesData.push(tileData);
		}
	}
	/* BOTTOM */
	for(var y=0; y<9; y++){
		for(var x=0; x<20; x++){
			const tileImageData=ctx.getImageData(x*8, 152+y*8, 8, 8);
			const tileData=_buildGBTileDataFromGrayscaleImageData(tileImageData);
			tilesData.push(tileData);
		}
	}
	/* LEFT AND RIGHT */
	for (var y=0; y<14; y++) {
		/* LEFT */
		for (var x=0; x<2; x++) {
			const tileImageData=ctx.getImageData(x*8, 40+y*8, 8, 8);
			const tileData=_buildGBTileDataFromGrayscaleImageData(tileImageData);
			tilesData.push(tileData);
		}
		/* RIGHT */
		for (var x=0; x<2; x++) {
			const tileImageData=ctx.getImageData(144+x*8, 40+y*8, 8, 8);
			const tileData=_buildGBTileDataFromGrayscaleImageData(tileImageData);
			tilesData.push(tileData);
		}
	}
	const finalData=new Uint8Array(new ArrayBuffer(0x1500));
	let writeOffset=0;
	/* write tiles data */
	for(var i=0; i<tilesData.length; i++){
		for(var j=0; j<16; j++){
			finalData[writeOffset++]=tilesData[i][j];
		}
	}
	currentPicture.injectData(finalData.buffer);
	_refreshCurrentPicture(true);
}