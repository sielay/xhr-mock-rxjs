import "jasmine";
import { Subscription, Observable } from "rxjs";
import { ajax } from "rxjs/observable/dom/ajax";
import { AjaxResponse } from "rxjs/observable/dom/AjaxObservable";
import mock from "xhr-mock";
import MockRequest from "xhr-mock/lib/MockRequest";
import MockResponse from "xhr-mock/lib/MockResponse";

interface IResponse {
  data: {
    id: string;
  }
};

describe("simple", () => {

  // replace the real XHR object with the mock XHR object before each test
  beforeEach(() => mock.setup());

  // put the real XHR object back and clear the mocks after each test
  afterEach(() => mock.teardown());

  it("should send the data as JSON", done => {

    mock.post("/api/user", (req: MockRequest, res: MockResponse) => {
      expect(req.header("Content-Type")).toEqual("application/json");
      expect(req.body()).toEqual("{\"foo\":\"bar\"}");
      res.body(JSON.stringify({ "ok": 1 }));
      return res;
    });

    let subscription: Subscription = ajax({
      url: "/api/user",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        foo: "bar"
      })
    })
      .subscribe((response: AjaxResponse) => {
        subscription.unsubscribe();
        subscription = null;
        done();
      }, (error: any) => {
        throw error;
      });
  });

  it("should resolve with some data when status=201", done => {

    mock.post("/api/user", {
      status: 201,
      reason: "Created",
      body: "{\"data\":{\"id\":\"abc-123\"}}"
    });

    let subscription: Subscription = ajax({
      url: "/api/user",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "John"
      })
    })
      .subscribe((response: AjaxResponse) => {
        subscription.unsubscribe();
        subscription = null;
        expect(response.response).toEqual("{\"data\":{\"id\":\"abc-123\"}}");
        done();
      }, (error: any) => {
        subscription.unsubscribe();
        subscription = null;
        throw error;
      });
  });

  it("should resolve with some data when status=201 - typed", done => {

    mock.post("/api/user", {
      status: 201,
      reason: "Created",
      body: "{\"data\":{\"id\":\"abc-123\"}}"
    });

    let subscription: Subscription = Observable
      .ajax({
        url: "/api/user",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "John"
        })
      })
      .map((response: AjaxResponse) => JSON.parse(response.response) as IResponse)
      .subscribe((response: IResponse) => {
        subscription.unsubscribe();
        subscription = null;
        expect(response).toEqual({ data: { id: "abc-123" } });
        done();
      }, (error: any) => {
        subscription.unsubscribe();
        subscription = null;
        throw error;
      });
  });

  it("should reject with an error when status=400", done => {

    mock.post("/api/user", {
      status: 400,
      reason: "Bad Request",
      body: "{\"error\":\"A user named \\\"John\\\" already exists.\"}"
    });

    let subscription: Subscription = ajax({
      url: "/api/user",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "John"
      })
    }).subscribe((response: AjaxResponse) => {
      throw new Error('Unexpected');
    }, (error: any) => {
      subscription.unsubscribe();
      subscription = null;
      done();
    });
  });

});