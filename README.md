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

#### 게시판 CRUD
게시판 기능을 위해 db구조를 다음과 같이 설계하였다.
<img width="736" alt="2018-12-06 12 13 51" src="https://user-images.githubusercontent.com/37579650/49522850-eb17ab00-f8eb-11e8-8f99-d22630174a52.png">
1. 게시판의 종류는 여러개가 있을 수 있다. 그정보는 POST_META 테이블로 관리한다.
2. 게시글은 POST 테이블에서 관리하며 postmeta_id 속성은 POST_META 테이블의 id를 참조하는 외래키 이다.
3. 게시글의 사진은 POSTIMAGE 테이블에서 관리하며 S3에 업로드한다.
4. POSTIMAGE테이블의 post_id 속성은 POST 테이블의 id를 참조하는 외래키 이다.
5. state는 정상 생성된 데이터는 'C', 삭제한 데이터는 'D'로 정의한다.

댓글기능과 게시글 추천기능을 위해 db구조를 다음과 같이 설계하였다.
<img width="807" alt="2018-12-08 8 22 41" src="https://user-images.githubusercontent.com/37579650/49685469-281bb180-fb27-11e8-90bd-425ebc647719.png">

#### 댓글 CRUD
1. 유저는 게시판에 댓글을 남길 수 있다.
2. COMMENT table의 post_id 속성은 POST table의 id를 참조하는 외래키 이다.
3. 해당 키로 특정 글에 소속된 댓글정보를 가져올 수 있다.
4. 게시글 정보를 가져오는 api호출 시 댓글정보, 댓글수, 조회수, 추천수, 특정글이 해당유저가 쓴 글인지, 해당유저가 쓴 댓글인지 정보를 제공한다.
5. 해당정보로 삭제, 수정등의 권한을 제어할 수 있다.
6. 댓글 삭제시 튜플을 삭제하지는 않으며 state 만 D로 변경한다.
7. 댓글 삭제시 해당 댓글 id만 전달받으면 외래키를 통해 POST의 comment_count 속성을 제어할 수 있다.
8. 작성 및 삭제시 POST의 comment_count 속성을 +-1 한다.

댓글, 게시글의 삭제, 수정권한이 없는자가 접근시에는 해당에러코드, 메세지를 리턴한다
```
    if(comment.writer_id != userId)
    {
        res.json({
            statusCode: 720,
            statusMsg: "This article is not yours"
        })
        conn.release()
        return
    }
```
에러코드 및 메세지는 엑셀로 정리하여 클라이언트 개발자가 개발시 참고할 수 있도록 한다.

#### 추천기능
1. 추천기능은 RECOMMEND table로 관리한다.
2. RECOMMEND table의 post_id 속성은 POST 테이블의 id를 참조하는 외래키이고 user_id 는 USER 테이블의 id를 참조하는 외래키 이다.
3. 게시물 추천시 post_id, user_id 정보를 삽입한다.
4. RECOMMEND table에 데이터 존재 유무로 추천취소, 중복추천등을 제어한다.
5. 추천및 취소시 post_id 외래키를 사용하여 POST 테이블의 star 속성을 +1 or -1 한다.

DB pool Connection 에러 수정
1. 기존로직에서 간헐적으로 max pool connection 에러가 발생.
2. 제한보다 pool을 많이 만들어서 발생하는 에러.
3. 코드 점검결과 매번 db에 접속시 pool을 생성하기 때문임.
4. DB에 접근시 pool을 생성하는 것이 아닌 connection만 가져와서 사용하도록 변경
```
const mysql2 = require("mysql2/promise")
const account = require("../config/account")

function createPool() {
    try {
        // Initialize MySQL DB
        const pool = mysql2.createPool({
            host: account.MYSQL_HOST,
            user: account.MYSQL_USERID,
            password: account.MYSQL_PASSWORD,
            database: account.MYSQL_DATABASE,
            port: account.MYSQL_PORT,
            connectionLimit: account.MYSQL_CONNECTION_LIMIT,
            dateStrings: ['DATE', 'DATETIMES'],
            waitForConnections: true,
            queueLimit: 0
        })

        return pool;
    } catch (error) {
        return console.log(`Could not connect - ${error}`);
    }
}

const pool = createPool()

module.exports = {
    connection: async() => pool.getConnection()
}
```
