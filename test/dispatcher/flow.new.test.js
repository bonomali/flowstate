var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager');


describe('Dispatcher#flow (NEW)', function() {
  
  // TODO: Make test case with return_to post parameter, to /authorize
  
  describe('login and return to with updated state', function() {
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
        req.state.authN = [ { method: 'password' } ];
        next();
      }
      
      chai.express.handler(dispatcher.flow(handler))
        .req(function(req) {
          request = req;
          request.method = 'POST';
          request.url = '/login';
          request.body = { state: 'txn123' };
          request.session = {};
          request.session.state = {};
          request.session.state['txn123'] = {
            returnTo: '/continue',
            client: 's6BhdRkqt3',
            redirectURI: 'https://client.example.com/cb'
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
      expect(dispatcher._store.load).to.have.callCount(1);
      expect(dispatcher._store.save).to.have.callCount(0);
      // FIXME: why 2?
      expect(dispatcher._store.update).to.have.callCount(2);
      expect(dispatcher._store.destroy).to.have.callCount(0);
    });
    
    it('should update state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        returnTo: '/continue',
        client: 's6BhdRkqt3',
        redirectURI: 'https://client.example.com/cb',
        authN: [ { method: 'password' } ]
      });
    });
    
    it('should persist state in session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'txn123': {
            client: 's6BhdRkqt3',
            redirectURI: 'https://client.example.com/cb',
            authN: [ { method: 'password' } ],
            returnTo: '/continue'
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
  
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/continue?state=txn123');
    });
  }); // login and resume
  
  
  
  describe.skip('incomplete external state prompting without options', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
    
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
    
    before(function(done) {
      function handler(req, res, next) {
        console.log('!!!! handler...');
        console.log(req.state);
        
        req.state.client = { id: '1', name: 'Example' }
        
        next();
        
        
        //res.prompt('consent');
      }
      
      dispatcher.use('/oauth2/authorize', { resume: [
        function(req, res, next) {
          console.log('RESUME???');
          //res.redirect('/from/' + req.state.name);
          
          res.prompt('consent');
        }
      ]});
    
      dispatcher.use('consent', { launch: [
        function(req, res, next) {
          res.redirect('/from/' + req.state.name);
        }
      ]});
    
    
      //chai.express.handler(dispatcher.flow('start', handler, { external: true }))
      chai.express.handler(dispatcher.flow(handler, { external: true }))
        .req(function(req) {
          request = req;
          request.url = '/oauth2/authorize';
          request.query = { state: 'X1' };
          request.session = {};
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
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(1);
      expect(dispatcher._store.update).to.have.callCount(0);
      expect(dispatcher._store.destroy).to.have.callCount(0);
    });
  
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'consent',
        parent: 'H1'
      });
    });
  
    it('should set locals', function() {
      expect(request.locals).to.deep.equal({});
    });
  
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
  
    it('should persist state in session', function() {
      //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
      //delete request.session.state['H1'].initiatedAt;
    
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: '/oauth2/authorize',
            client: { id: '1', name: 'Example' }
          }
        }
      });
    });
  
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/consent?state=H1');
    });
  }); // prompting without options
  
  
  
  describe.skip('returning to location specified in state', function() {
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
        next();
      }
      
      chai.express.handler(dispatcher.flow('/login', handler))
        .req(function(req) {
          request = req;
          //request.url = '/login';
          request.query = { state: 'A62bpAbj' };
          request.session = { state: {} };
          request.session.state['A62bpAbj'] = { name: '/login', foo: 'bar', returnTo: '/dashboard' };
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
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('A62bpAbj');
    
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(0);
    
      expect(dispatcher._store.destroy).to.have.callCount(1);
      call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('A62bpAbj');
    });
  
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.be.null;
      expect(request.state).to.deep.equal({
        name: '/login',
        foo: 'bar',
        returnTo: '/dashboard'
      });
    });
  
    it('should remove completed state from session', function() {
      expect(request.session).to.deep.equal({});
    });
  
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/dashboard');
    });
  }); // returning to location specified in state
  
  
  describe.skip('returning to location specified in state and restoring prior state', function() {
    var hc = 1;
    var dispatcher = new Dispatcher()
      , request, response, err;
  
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
  
    before(function(done) {
      /*
      dispatcher.use('login', { resume: [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], exit: [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]});
      */
    
      function handler(req, res, next) {
        res.__track = req.state.name;
        next();
      }
    
    
      chai.express.handler(dispatcher.flow('/oauth2/redirect', handler))
        .req(function(req) {
          request = req;
          //request.url = '/oauth2/redirect';
          request.query = { state: 'ogWlCcTb8C8' };
          request.session = { state: {} };
          request.session.state['8KraIxA8PJA'] = { name: '/ebooks/awesome-sauce', views: 1 };
          request.session.state['ogWlCcTb8C8'] = { name: '/oauth2/redirect', verifier: 'secret', returnTo: '/ebooks/awesome-sauce', parent: '8KraIxA8PJA' };
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
  
  
    it('should track correctly', function() {
      //expect(response.__track).to.equal('federate login(federate)[F]');
    });
  
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(2);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('ogWlCcTb8C8');
      var call = dispatcher._store.load.getCall(1);
      expect(call.args[1]).to.equal('8KraIxA8PJA');
    
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(0);
    
      expect(dispatcher._store.destroy).to.have.callCount(1);
      var call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('ogWlCcTb8C8');
      //var call = dispatcher._store.destroy.getCall(1);
      //expect(call.args[1]).to.equal('8KraIxA8PJA');
    });
  
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      //expect(request.state.handle).to.be.null;
      expect(request.state).to.deep.equal({
        name: '/ebooks/awesome-sauce',
        views: 1,
      });
    });
  
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.null;
      expect(request.yieldState).to.deep.equal({
        name: '/oauth2/redirect',
        verifier: 'secret',
        returnTo: "/ebooks/awesome-sauce",
        parent: '8KraIxA8PJA'
      });
    });
    
    it('should set yieldStateStack', function() {
      expect(request.yieldStateStack).to.be.an('array');
      expect(request.yieldStateStack).to.have.length(1);
      expect(request.yieldStateStack).to.deep.equal([ {
        name: '/oauth2/redirect',
        verifier: 'secret',
        returnTo: "/ebooks/awesome-sauce",
        parent: '8KraIxA8PJA'
      } ]);
    });
  
    it('should remove completed state from session', function() {
      expect(request.session).to.deep.equal({
        state: {
          "8KraIxA8PJA": {
            name: '/ebooks/awesome-sauce',
            views: 1,
          }
        }
      });
    });
  
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/ebooks/awesome-sauce?state=8KraIxA8PJA');
    });
  }); // returning to location specified in state and restoring prior state
  
  
  describe.skip('returning to location specified in state and restoring prior state with update', function() {
    var hc = 1;
    var dispatcher = new Dispatcher()
      , request, response, err;
  
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
  
    before(function(done) {
      /*
      dispatcher.use('login', { resume: [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], exit: [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]});
      */
      
      dispatcher.yield('/ebooks/awesome-sauce', '/oauth2/redirect', [
        function(req, res, next) {
          console.log('XXXXX');
          console.log(req);
          
          req.state.user = req.externalUser;
          next();
          
          //res.__track += ' <' + req.yieldState.name + '>';
          //req.state.issuer = req.yieldState.issuer;
          //next();
        }
      ]);
    
      function handler(req, res, next) {
        res.__track = req.state.name;
        req.externalUser = { issuer: 'https://id.example.com', sub: '501' };
        next();
      }
    
    
      chai.express.handler(dispatcher.flow('/oauth2/redirect', handler))
        .req(function(req) {
          request = req;
          //request.url = '/oauth2/redirect';
          request.query = { state: 'ogWlCcTb8C8' };
          request.session = { state: {} };
          request.session.state['8KraIxA8PJA'] = { name: '/ebooks/awesome-sauce', views: 1 };
          request.session.state['ogWlCcTb8C8'] = { name: '/oauth2/redirect', verifier: 'secret', returnTo: '/ebooks/awesome-sauce', parent: '8KraIxA8PJA' };
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
  
  
    it('should track correctly', function() {
      //expect(response.__track).to.equal('federate login(federate)[F]');
    });
  
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(2);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('ogWlCcTb8C8');
      var call = dispatcher._store.load.getCall(1);
      expect(call.args[1]).to.equal('8KraIxA8PJA');
    
      // FIXME: This should save the state
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(0);
    
      expect(dispatcher._store.destroy).to.have.callCount(1);
      var call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('ogWlCcTb8C8');
      //var call = dispatcher._store.destroy.getCall(1);
      //expect(call.args[1]).to.equal('8KraIxA8PJA');
    });
  
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      //expect(request.state.handle).to.be.null;
      expect(request.state).to.deep.equal({
        name: '/ebooks/awesome-sauce',
        returnTo: '/',
        user: {
          issuer: 'https://id.example.com',
          sub: '501'
        },
        views: 1,
      });
    });
  
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.null;
      expect(request.yieldState).to.deep.equal({
        name: '/oauth2/redirect',
        verifier: 'secret',
        returnTo: "/ebooks/awesome-sauce",
        parent: '8KraIxA8PJA'
      });
    });
    
    it('should set yieldStateStack', function() {
      expect(request.yieldStateStack).to.be.an('array');
      expect(request.yieldStateStack).to.have.length(1);
      expect(request.yieldStateStack).to.deep.equal([ {
        name: '/oauth2/redirect',
        verifier: 'secret',
        returnTo: "/ebooks/awesome-sauce",
        parent: '8KraIxA8PJA'
      } ]);
    });
  
    it('should remove completed state from session', function() {
      expect(request.session).to.deep.equal({
        state: {
          "8KraIxA8PJA": {
            name: '/ebooks/awesome-sauce',
            returnTo: '/',
            user: {
              issuer: 'https://id.example.com',
              sub: '501'
            },
            views: 1,
          }
        }
      });
    });
  
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/ebooks/awesome-sauce?state=8KraIxA8PJA');
    });
  }); // returning to location specified in state and restoring prior state with update
  
  
});
