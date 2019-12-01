var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager');


describe('Dispatcher#flow (SSO)', function() {
  
  describe('redirect back from OAuth 2.0 authorization server', function() {
  
    describe.only('and returning home', function() {
      var dispatcher = new Dispatcher()
        , request, response, err;
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
    
      before(function(done) {
        function handler(req, res, next) {
          req.federatedUser = { id: '248289761001', provider: 'http://server.example.com' };
          next();
        }
      
        chai.express.handler(dispatcher.flow(handler))
          .req(function(req) {
            request = req;
            request.method = 'GET';
            request.url = '/oauth2/redirect?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj';
            request.query = { code: 'SplxlOBeZQQYbYS6WxSbIA', state: 'af0ifjsldkj' };
            request.session = {};
            request.session.state = {};
            request.session.state['af0ifjsldkj'] = {
              returnTo: '/home',
              provider: 'http://server.example.com'
            };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .next(function(err) {
            console.log(err);
          })
          .dispatch();
      });
  
      after(function() {
        dispatcher._store.destroy.restore();
        dispatcher._store.update.restore();
        dispatcher._store.save.restore();
        dispatcher._store.load.restore();
      });
  
  
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(1);
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
    
      it('should update state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          returnTo: '/home',
          provider: 'http://server.example.com'
        });
      });
    
      // FIXME: this state should be removed
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'af0ifjsldkj': {
              returnTo: '/home',
              provider: 'http://server.example.com'
            }
          }
        });
      });
    
      it('should not set locals', function() {
        expect(request.locals).to.be.undefined;
      });
  
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/home?state=af0ifjsldkj'); // FIXME: This needs a state param
      });
    }); // and returning home
    
    describe('and returning home with preserved state', function() {
      var dispatcher = new Dispatcher()
        , request, response, err;
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
    
      before(function(done) {
        // TODO: test case with multiple handlers
        function handler(req, res, next) {
          req.federatedUser = { id: '248289761001', provider: 'http://server.example.com' };
          next();
        }
      
        chai.express.handler(dispatcher.flow(handler))
          .req(function(req) {
            request = req;
            request.method = 'GET';
            request.url = '/oauth2/redirect?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj';
            request.query = { code: 'SplxlOBeZQQYbYS6WxSbIA', state: 'af0ifjsldkj' };
            request.session = {};
            request.session.state = {};
            request.session.state['af0ifjsldkj'] = {
              provider: 'http://server.example.com',
              returnTo: '/home',
              state: 'Dxh5N7w_wMQ'
            };
            request.session.state['Dxh5N7w_wMQ'] = {
              accounts: [ { id: '1207059', provider: 'https://www.facebook.com' } ]
            };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });
  
      after(function() {
        dispatcher._store.destroy.restore();
        dispatcher._store.update.restore();
        dispatcher._store.save.restore();
        dispatcher._store.load.restore();
      });
  
  
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(2);
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(1);
      });
    
      it('should set properties on request', function() {
        expect(request.federatedUser).to.be.an('object');
        expect(request.federatedUser).to.deep.equal({ id: '248289761001', provider: 'http://server.example.com' });
      });
    
      it('should update state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          accounts: [ { id: '1207059', provider: 'https://www.facebook.com' } ]
        });
      });
    
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'Dxh5N7w_wMQ': {
              accounts: [ { id: '1207059', provider: 'https://www.facebook.com' } ]
            }
          }
        });
      });
    
      it('should not set locals', function() {
        expect(request.locals).to.be.undefined;
      });
  
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.an('object'); // FIXME: remove yieldState
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/home?state=Dxh5N7w_wMQ');
      });
    }); // and returning home with preserved state
    
    describe('and returning home with preserved state by using array notation', function() {
      var dispatcher = new Dispatcher()
        , request, response, err;
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
    
      before(function(done) {
        // TODO: test case with multiple handlers
        function handler(req, res, next) {
          req.federatedUser = { id: '248289761001', provider: 'http://server.example.com' };
          next();
        }
      
        chai.express.handler(dispatcher.flow([ handler ]))
          .req(function(req) {
            request = req;
            request.method = 'GET';
            request.url = '/oauth2/redirect?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj';
            request.query = { code: 'SplxlOBeZQQYbYS6WxSbIA', state: 'af0ifjsldkj' };
            request.session = {};
            request.session.state = {};
            request.session.state['af0ifjsldkj'] = {
              provider: 'http://server.example.com',
              returnTo: '/home',
              state: 'Dxh5N7w_wMQ'
            };
            request.session.state['Dxh5N7w_wMQ'] = {
              accounts: [ { id: '1207059', provider: 'https://www.facebook.com' } ]
            };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });
  
      after(function() {
        dispatcher._store.destroy.restore();
        dispatcher._store.update.restore();
        dispatcher._store.save.restore();
        dispatcher._store.load.restore();
      });
  
  
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(2);
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(1);
      });
    
      it('should set properties on request', function() {
        expect(request.federatedUser).to.be.an('object');
        expect(request.federatedUser).to.deep.equal({ id: '248289761001', provider: 'http://server.example.com' });
      });
    
      it('should update state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          accounts: [ { id: '1207059', provider: 'https://www.facebook.com' } ]
        });
      });
    
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'Dxh5N7w_wMQ': {
              accounts: [ { id: '1207059', provider: 'https://www.facebook.com' } ]
            }
          }
        });
      });
    
      it('should not set locals', function() {
        expect(request.locals).to.be.undefined;
      });
  
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.an('object'); // FIXME: remove yieldState
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/home?state=Dxh5N7w_wMQ');
      });
    }); // and returning home with preserved state by using array notation
  
  }); // redirect back from OAuth 2.0 authorization server
  
});
