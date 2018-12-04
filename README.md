### SALAD

#### Depromeet Final Project
월급쟁이들을 위한 현실적인 급여현황, 정보 어플리케이션

Design : 이슬, 윤민희
Client : IOS(한영수) , Android(최문경, 정진용)
Server : Nodejs/Express 조호영

DB : Mysql:8.0

#### 세션유지는 jwtwebtoken을 활용한다.
```
app.use(expressJWT({
    secret: account.JWT_SECRET,
    credentialsRequired: false,
    getToken: function fromHeaderOrQuerystring (req) {
     //   console.log(req.headers)
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        }
        return null;
    }
}));
```

#### 유저정보는 Firebase를 사용하지 않으므로 자체의 보안방식을 사용한다.
1. 유저가 회원가입을 하면 랜덤 Salt 를 만들어 db에 저장한다.
2. db에 저장되는 유저의 Password는 이 Salt를 활용하여 입력받은 password를 암호한 값이다.
```
function cryptoPassword(password){

    return new Promise((resolve,reject) => {

        crypto.randomBytes(64, async (err, buf) => {

            crypto.pbkdf2(password, buf.toString('base64'), 100000, 64, 'sha512', (err, key) => {

                let obj = [buf.toString('base64'),key.toString('base64')]
                resolve(obj)
            });
        });
    })
}
```
3. 유저가 로그인 할때는 입력받은 비밀번호, 유저정보에 저장된 salt를 사용하여 암호화, 저장된 password와 비교하여 인증한다.
```
if (userinfo.password == await promiseHandler.getHashedPassword(password, userinfo.salt)) {
            jwt.generate(useremail, function (err, accesstoken, refreshtoken) {

                res.json({
                    statusCode: 200,
                    accesstoken: accesstoken,
                    refreshtoken: refreshtoken
                })
                conn.release()
                return
            })
        }
        else {
            res.json({
                statusCode: 709,
                statusMsg: "Invalid password"
            })
            conn.release()
            return
        }
```
4. 로그인에 성공하면 jwt토큰 값을 클라이언트에 전달해주며 해당 토큰으로 세션을 관리한다.
5. 토큰이 만료시 refreshtoken으로 accesstoken을 갱신하여 다시 클라이언트에 전달한다.

#### Swagger 연동
- api문서 작성은 swagger를 연동하여 작성한다.

#### Oauth
1. Oauth의 경우 별도의 회원가입 과정을 거치지 않는다.
2. 다만, Oauth로 처음 접속하는 유저의 경우 특정코드를 반납, 닉네임을 입력하게 한다.
3. 게시판의 특성상 Oauth에서 제공하는 uid를 유저닉네임으로 쓰는것은 적합하지 않은것 같다.
4. 새로운 유저가 닉네임을 입력하면, DB에 회원 레코드를 넣는다.
5. 해당유저는 다음에 Oauth시 별도의 과정 없이 바로 로그인 하게 된다.

#### Multipart
1. 유저의 프로필 사진은 AWS s3에 multer-s3를 사용하여 업로드 한다.
2. 업로드 후 리턴받은 url은 PROFILE table의 media_url 속성에 저장한다.
3. 유저의 프로필의 user_id속성은 USER 테이블의 id를 참조하는 외래키 이다.
4. PROFILE table에서 유저의 프로필사진, 정보 등을 관리한다.