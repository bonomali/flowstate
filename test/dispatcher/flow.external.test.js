var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager');


describe('Dispatcher#flow (externally-initiated)', function() {
  
  describe('prompting via redirect', function() {
    
    describe('without options', function() {
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
          res.prompt('consent');
        }
      
        dispatcher.use('consent', [
          function(req, res, next) {
            res.redirect('/from/' + req.state.name);
          }
        ], null);
      
      
        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
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
              name: 'start'
            }
          }
        });
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/consent?state=H1');
      });
    }); // without options
    
    describe('with options', function() {
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
          res.prompt('consent', { scope: 'test' });
        }
      
        dispatcher.use('consent', [
          function(req, res, next) {
            res.redirect('/from/' + req.state.name + '?scope=' + req.locals.scope);
          }
        ], null);
      
      
        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
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
        expect(request.locals).to.deep.equal({
          scope: 'test'
        });
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
              name: 'start'
            }
          }
        });
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/consent?scope=test&state=H1');
      });
    }); // with options
    
  }); // prompting via redirect
  
  describe('responding immediately', function() {
    
    describe('by redirecting', function() {
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
          res.redirect('/from/' + req.state.name);
        }
      
      
        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
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
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          name: 'start'
        });
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should not persist state in session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/start');
      });
    }); // by redirecting
    
    describe('by rendering', function() {
      var dispatcher = new Dispatcher()
        , request, response, layout, err;
      
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
      
      before(function(done) {
        function handler(req, res, next) {
          res.render('views/' + req.state.name);
        }
      
      
        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
            request.query = { state: 'X1' };
            request.session = {};
          })
          .res(function(res) {
            res.locals = {};
          })
          .render(function(res, lay) {
            layout = lay;
            res.end();
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
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          name: 'start'
        });
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should not persist state in session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should render layout', function() {
        expect(layout).to.equal('views/start');
        expect(response.locals).to.deep.equal({});
      });
    }); // by rendering
    
  }); // responding immediately
  
});
